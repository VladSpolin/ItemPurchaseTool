public inherited sharing class UserSelector {
    public static User getCurrentUser() {
        return [SELECT Id, IsManager__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
    }
}