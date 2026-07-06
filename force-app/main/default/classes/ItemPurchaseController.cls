public with sharing class ItemPurchaseController {

    @AuraEnabled(cacheable=true)
    public static Account getAccountDetails(Id accountId) {
        return ItemSelector.getAccountById(accountId);
    }

    @AuraEnabled(cacheable=true)
    public static List<Item__c> getItems(String searchKey, String familyFilter, String typeFilter) {
        return ItemSelector.getItemsByFilters(searchKey, familyFilter, typeFilter);
    }
}