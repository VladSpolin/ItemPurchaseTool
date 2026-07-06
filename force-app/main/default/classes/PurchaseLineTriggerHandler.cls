public inherited sharing class PurchaseLineTriggerHandler {
    
    public static void handleAfter(List<PurchaseLine__c> newList, List<PurchaseLine__c> oldList) {
        Set<Id> purchaseIds = new Set<Id>();

        if (newList != null) {
            for (PurchaseLine__c line : newList) {
                purchaseIds.add(line.PurchaseId__c);
            }
        }
        if (oldList != null) {
            for (PurchaseLine__c line : oldList) {
                purchaseIds.add(line.PurchaseId__c);
            }
        }

        if (purchaseIds.isEmpty()) return;

        Map<Id, Purchase__c> purchasesToUpdate = new Map<Id, Purchase__c>();
        for (Id pId : purchaseIds) {
            // ВАЖНО: убедись, что API-имена полей сумм именно такие. 
            // Иногда они могут сгенерироваться как Grand_Total__c
            purchasesToUpdate.put(pId, new Purchase__c(
                Id = pId,
                TotalItems__c = 0,
                GrandTotal__c = 0 
            ));
        }

        for (PurchaseLine__c line : [SELECT PurchaseId__c, Amount__c, UnitCost__c FROM PurchaseLine__c WHERE PurchaseId__c IN :purchaseIds]) {
            Purchase__c parent = purchasesToUpdate.get(line.PurchaseId__c);
            
            Decimal amount = line.Amount__c != null ? line.Amount__c : 0;
            Decimal cost = line.UnitCost__c != null ? line.UnitCost__c : 0;

            parent.TotalItems__c += amount;
            parent.GrandTotal__c += (amount * cost);
        }

        update purchasesToUpdate.values();
    }
}