import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private registerUrl = 'http://127.0.0.1:5000/api/register';
  private loginUrl = 'http://127.0.0.1:5000/api/login';

  constructor(private http: HttpClient) {}

  register(username: string, password: string): Observable<any> {
    return this.http.post(this.registerUrl, { username, password });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.loginUrl, { username, password });
  }
}
