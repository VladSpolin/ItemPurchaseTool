public with sharing class ItemPurchaseController {

    @AuraEnabled(cacheable=true)
    public static Account getAccountDetails(Id accountId) {
        return AccountSelector.getAccountById(accountId);
    }

    @AuraEnabled(cacheable=true)
    public static List<Item__c> getItems(String searchKey, String familyFilter, String typeFilter) {
        return ItemSelector.getItemsByFilters(searchKey, familyFilter, typeFilter);
    }

    @AuraEnabled(cacheable=true)
    public static Boolean checkIsManager() {
        return UserSelector.getCurrentUser().IsManager__c == true;
    }

    @AuraEnabled
    public static Id checkout(Id accountId, String cartItemsJson) {
        return PurchaseService.processCheckout(accountId, cartItemsJson);
    }
}