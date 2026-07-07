public inherited sharing class UnsplashService {
    
    private static final String CLIENT_ID = 'IV4t8uRC8cDIbdRkJJ9baQ0uEI4U5K8hdAT7i11NjD8'; 
    private static final String ENDPOINT = 'https://api.unsplash.com/search/photos?query=';

    public static String getImageUrl(String searchQuery) {
        if (String.isBlank(searchQuery)) return null;

        // Кодируем пробелы и спецсимволы в названии товара для URL
        String encodedQuery = EncodingUtil.urlEncode(searchQuery, 'UTF-8');

        HttpRequest req = new HttpRequest();
        req.setEndpoint(ENDPOINT + encodedQuery);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Client-ID ' + CLIENT_ID); // Передаем ключ авторизации

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> jsonBody = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> results = (List<Object>) jsonBody.get('results');
            
            if (results != null && !results.isEmpty()) {
                // Берем первую картинку из результатов
                Map<String, Object> firstResult = (Map<String, Object>) results[0];
                Map<String, Object> urls = (Map<String, Object>) firstResult.get('urls');
                
                return (String) urls.get('regular');
            }
        }
        
        return null; 
    }
}