public inherited sharing class ItemSelector {

    // Получение Аккаунта
    public static Account getAccountById(Id accountId) {
        return [SELECT Id, Name, AccountNumber, Industry FROM Account WHERE Id = :accountId LIMIT 1];
    }

    // Получение товаров с динамической фильтрацией
    public static List<Item__c> getItemsByFilters(String searchKey, String familyFilter, String typeFilter) {
        String query = 'SELECT Id, Name, Description__c, Family__c, Type__c, Image__c, Price__c, AvailableQuantity__c FROM Item__c';
        List<String> conditions = new List<String>();

        if (String.isNotBlank(searchKey)) {
            // Экранируем ввод для защиты от SOQL-инъекций
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