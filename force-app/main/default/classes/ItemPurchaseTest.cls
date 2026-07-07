@isTest
private class ItemPurchaseTest {

    @testSetup
    static void setupData() {
        // 1. Создаем аккаунт
        Account acc = new Account(Name = 'Test Account', AccountNumber = 'ACC-123', Industry = 'Technology');
        insert acc;

        // 2. Создаем тестовые товары
        Item__c item1 = new Item__c(Name = 'Apple', AvailableQuantity__c = 10, Price__c = 100, Type__c = 'Type 1', Family__c = 'Family 1');
        Item__c item2 = new Item__c(Name = 'Banana', AvailableQuantity__c = 5, Price__c = 150, Type__c = 'Type 2', Family__c = 'Family 2');
        insert new List<Item__c>{item1, item2};
    }

    @isTest
    static void testReadOperations() {
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        Account resultAcc = ItemPurchaseController.getAccountDetails(acc.Id);
        List<Item__c> filteredItems = ItemPurchaseController.getItems('App', 'Family 1', 'Type 1');
        Boolean isManager = ItemPurchaseController.checkIsManager();
        Test.stopTest();

        System.assertNotEquals(null, resultAcc, 'Account details should be retrieved');
        System.assertEquals('ACC-123', resultAcc.AccountNumber, 'Account number should match');
        System.assertEquals(1, filteredItems.size(), 'Filters should return exactly 1 item (Apple)');
        System.assertEquals(false, isManager, 'Standard test user should not be a manager by default');
    }

    @isTest
    static void testSuccessfulCheckoutAndTrigger() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        List<Item__c> items = [SELECT Id, Price__c FROM Item__c];

        // Эмулируем корзину из LWC в формате JSON строки
        List<Map<String, Object>> cartItems = new List<Map<String, Object>>();
        cartItems.add(new Map<String, Object>{
            'itemId' => items[0].Id,
            'quantity' => 2,
            'unitCost' => items[0].Price__c
        });
        String cartJson = JSON.serialize(cartItems);

        Test.startTest();
        Id purchaseId = ItemPurchaseController.checkout(acc.Id, cartJson);
        Test.stopTest();

        System.assertNotEquals(null, purchaseId, 'Purchase record should be successfully created');

        Item__c updatedItem = [SELECT AvailableQuantity__c FROM Item__c WHERE Id = :items[0].Id];
        System.assertEquals(8, updatedItem.AvailableQuantity__c, 'Available quantity should decrease by 2');

        Purchase__c purchase = [SELECT TotalItems__c, GrandTotal__c FROM Purchase__c WHERE Id = :purchaseId];
        System.assertEquals(2, purchase.TotalItems__c, 'Trigger should set TotalItems to 2');
        System.assertEquals(200, purchase.GrandTotal__c, 'Trigger should set GrandTotal to 200 (2 * 100)');
    }

    @isTest
    static void testCheckoutInsufficientQuantity() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Item__c item = [SELECT Id, Price__c FROM Item__c WHERE Name = 'Banana' LIMIT 1]; // Доступно 5 штук

        List<Map<String, Object>> cartItems = new List<Map<String, Object>>();
        cartItems.add(new Map<String, Object>{
            'itemId' => item.Id,
            'quantity' => 10, // Пытаемся купить 10 при наличии 5
            'unitCost' => item.Price__c
        });
        String cartJson = JSON.serialize(cartItems);

        Boolean exceptionThrown = false;
        Test.startTest();
        try {
            ItemPurchaseController.checkout(acc.Id, cartJson);
        } catch (AuraHandledException e) {
            exceptionThrown = true;
        }
        Test.stopTest();

        System.assertEquals(true, exceptionThrown, 'AuraHandledException should be thrown due to low stock');
    }

    @isTest
    static void testCreateItemAsManagerWithUnsplash() {
        Profile p = [SELECT Id FROM Profile WHERE Name='System Administrator' LIMIT 1];        
        User managerUser = new User(
            Alias = 'mngr', Email='manageruser@test.com', 
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', ProfileId = p.Id, IsManager__c = true,
            TimeZoneSidKey='America/Los_Angeles', UserName='manageruser' + DateTime.now().getTime() + '@test.com'
        );
        insert managerUser;

        System.runAs(managerUser) {
            Test.setMock(HttpCalloutMock.class, new UnsplashHttpCalloutMock());

            Test.startTest();
            Id newItemId = ItemPurchaseController.createItem('Orange', 'Fresh oranges', 'Family 1', 'Type 1', 50, 20);
            Test.stopTest();

            System.assertNotEquals(null, newItemId, 'New item should be created by manager');

            Item__c createdItem = [SELECT Image__c FROM Item__c WHERE Id = :newItemId];
            System.assertEquals('https://images.unsplash.com/photo-fake-image-url.jpg', createdItem.Image__c, 'Image URL should match Mock data');
        }
    }
}