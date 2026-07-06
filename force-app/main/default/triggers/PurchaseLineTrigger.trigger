trigger PurchaseLineTrigger on PurchaseLine__c (after insert, after update, after delete, after undelete) {
    
    if (Trigger.isAfter) {
        PurchaseLineTriggerHandler.handleAfter(Trigger.new, Trigger.old);
    }
}