public inherited sharing class AccountSelector {
    public static Account getAccountById(Id accountId) {
        return [SELECT Id, Name, AccountNumber, Industry FROM Account WHERE Id = :accountId LIMIT 1];
    }
}