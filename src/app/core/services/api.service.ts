import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Profile, ProfileRequest } from '../models/profile.model';
import { Meal, DashboardResponse } from '../models/meal.model';
import { ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return this.http.get<ApiResponse<Profile>>(`${this.apiUrl}/profile`).pipe(
      map(response => response.data!)
    );
  }

  createProfile(request: ProfileRequest): Observable<Profile> {
    return this.http.post<ApiResponse<Profile>>(`${this.apiUrl}/profile`, request).pipe(
      map(response => response.data!)
    );
  }

  getMeals(date: string): Observable<Meal[]> {
    return this.http.get<ApiResponse<Meal[]>>(`${this.apiUrl}/meals`, {
      params: { date }
    }).pipe(
      map(response => response.data ?? [])
    );
  }

  registerMeal(description: string): Observable<Meal> {
    return this.http.post<ApiResponse<Meal>>(`${this.apiUrl}/meals`, { description }).pipe(
      map(response => response.data!)
    );
  }

  deleteMeal(mealId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/meals/${mealId}`);
  }

  getDashboard(date: string): Observable<DashboardResponse> {
    return this.http.get<ApiResponse<DashboardResponse>>(`${this.apiUrl}/dashboard`, {
      params: { date }
    }).pipe(
      map(response => response.data!)
    );
  }
}
