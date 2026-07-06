public inherited sharing class ItemSelector {

    public static List<Item__c> getItemsByIds(Set<Id> itemIds) {
        return [SELECT Id, Name, AvailableQuantity__c, Price__c FROM Item__c WHERE Id IN :itemIds];
    }

    public static List<Item__c> getItemsByFilters(String searchKey, String familyFilter, String typeFilter) {
        String query = 'SELECT Id, Name, Description__c, Family__c, Type__c, Image__c, Price__c, AvailableQuantity__c FROM Item__c';
        List<String> conditions = new List<String>();

        if (String.isNotBlank(searchKey)) {
            String key = '%' + String.escapeSingleQuotes(searchKey) + '%';
            conditions.add('(Name LIKE :key OR Description__c LIKE :key)');
        }
        if (String.isNotBlank(familyFilter)) {
            conditions.add('Family__c = :familyFilter');
        }
        if (String.isNotBlank(typeFilter)) {
            conditions.add('Type__c = :typeFilter');
        }

        if (!conditions.isEmpty()) {
            query += ' WHERE ' + String.join(conditions, ' AND ');
        }

        return Database.query(query);
    }
}