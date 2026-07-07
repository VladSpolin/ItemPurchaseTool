@isTest
public class UnsplashHttpCalloutMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        // Создаем фейковый HTTP-ответ
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        res.setBody('{"results": [{"urls": {"regular": "https://images.unsplash.com/photo-fake-image-url.jpg"}}]}');
        res.setStatusCode(200);
        return res;
    }
}