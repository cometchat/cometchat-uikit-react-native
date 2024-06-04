export class CometChatNetworkUtils {
    
    static async fetcher({ url, method, body, headers }: { url: string, method: string, body: any, headers: any }) {
        try {
            const res = await fetch(url, {
                method: method,
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    ...headers,
                },
            });
            const json = await res.json();
            return res;
        } catch (error) {
            throw error;
        }
    }
     
}

export function isHttpUrl(string) {
    const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return regex.test(string);
}