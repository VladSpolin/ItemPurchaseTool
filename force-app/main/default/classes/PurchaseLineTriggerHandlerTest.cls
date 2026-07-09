@isTest
private class PurchaseLineTriggerHandlerTest {

    @isTest
    static void testRollupCalculations() {
        // 1. ПОДГОТОВКА ДАННЫХ
        Item__c testItem = new Item__c(
            Name = 'Test Phone',
            Price__c = 50,
            AvailableQuantity__c = 100
        );
        insert testItem;

        Purchase__c parentPurchase = new Purchase__c();
        insert parentPurchase;

        Test.startTest();

        PurchaseLine__c line = new PurchaseLine__c(
            PurchaseId__c = parentPurchase.Id,
            ItemId__c = testItem.Id, 
            Amount__c = 2,
            UnitCost__c = 50 
        );
        insert line; 
        
        Purchase__c checkInsert = [SELECT TotalItems__c, GrandTotal__c FROM Purchase__c WHERE Id = :parentPurchase.Id];
        System.assertEquals(2, checkInsert.TotalItems__c, 'Total items should be 2 after insert');
        System.assertEquals(100, checkInsert.GrandTotal__c, 'Grand total should be 100 after insert');

        PurchaseLine__c lineToUpdate = new PurchaseLine__c(
            Id = line.Id, 
            Amount__c = 3 
        );
        update lineToUpdate;

        Purchase__c checkUpdate = [SELECT TotalItems__c, GrandTotal__c FROM Purchase__c WHERE Id = :parentPurchase.Id];
        System.assertEquals(3, checkUpdate.TotalItems__c, 'Total items should be 3 after update');
        System.assertEquals(150, checkUpdate.GrandTotal__c, 'Grand total should be 150 after update');

        delete lineToUpdate;

        Purchase__c checkDelete = [SELECT TotalItems__c, GrandTotal__c FROM Purchase__c WHERE Id = :parentPurchase.Id];
        System.assertEquals(0, checkDelete.TotalItems__c, 'Total items should be 0 after delete');
        System.assertEquals(0, checkDelete.GrandTotal__c, 'Grand total should be 0 after delete');

        Test.stopTest();
    }
}