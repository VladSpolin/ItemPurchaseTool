public inherited sharing class PurchaseService {
    
    public class CartItemWrapper {
        public Id itemId;
        public Integer quantity;
        public Decimal unitCost;
    }

    public static Id processCheckout(Id accountId, String cartItemsJson) {
        List<CartItemWrapper> cartItems = (List<CartItemWrapper>) JSON.deserialize(cartItemsJson, List<CartItemWrapper>.class);
        
        Set<Id> itemIds = new Set<Id>();
        for (CartItemWrapper ci : cartItems) {
            itemIds.add(ci.itemId);
        }

        // Получаем актуальные данные товаров из БД
        List<Item__c> dbItems = ItemSelector.getItemsByIds(itemIds);
        Map<Id, Item__c> itemsMap = new Map<Id, Item__c>(dbItems);
        List<Item__c> itemsToUpdate = new List<Item__c>();

        // Валидация остатков
        for (CartItemWrapper ci : cartItems) {
            Item__c dbItem = itemsMap.get(ci.itemId);
            if (dbItem == null || dbItem.AvailableQuantity__c < ci.quantity) {
                throw new AuraHandledException('Not enough quantity available for item: ' + (dbItem != null ? dbItem.Name : 'Unknown'));
            }
            dbItem.AvailableQuantity__c -= ci.quantity;
            itemsToUpdate.add(dbItem);
        }

        // Транзакция базы данных
        Savepoint sp = Database.setSavepoint();
        try {
            update itemsToUpdate;

            Purchase__c newPurchase = new Purchase__c(ClientId__c = accountId);
            insert newPurchase;

            List<PurchaseLine__c> linesToInsert = new List<PurchaseLine__c>();
            for (CartItemWrapper ci : cartItems) {
                linesToInsert.add(new PurchaseLine__c(
                    PurchaseId__c = newPurchase.Id,
                    ItemId__c = ci.itemId,
                    Amount__c = ci.quantity,
                    UnitCost__c = ci.unitCost
                ));
            }
            insert linesToInsert;

            return newPurchase.Id;
        } catch (Exception e) {
            Database.rollback(sp);
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static Id createNewItem(String name, String description, String family, String type, Decimal price, Integer availableQuantity) {
    if (UserSelector.getCurrentUser().IsManager__c != true) {
        throw new AuraHandledException('Access Denied: Only managers can create items.');
    }

    String imageUrl = null;
    try {
        imageUrl = UnsplashService.getImageUrl(type); 
    } catch (Exception e) {
        System.debug('Error fetching image from Unsplash: ' + e.getMessage());
    }

    Item__c newItem = new Item__c(
        Name = name,
        Description__c = description,
        Family__c = family,
        Type__c = type,
        Price__c = price,
        AvailableQuantity__c = availableQuantity,
        Image__c = imageUrl
    );

    insert newItem;
    return newItem.Id;
}
}