import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, effect, input, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Position } from '@capacitor/geolocation';
import { GoogleMap } from '@capacitor/google-maps';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MapsPage implements AfterViewInit, OnDestroy {
  map: GoogleMap | undefined;
  addedMarkers: string[] = [];
  markerCoordinate = input<Position | undefined>();

  constructor() {
    effect(async () => {
      if (this.markerCoordinate() !== undefined) {
        this.addedMarkers.push(
          await this.map!.addMarker({
            coordinate: {
              lat: this.markerCoordinate()!.coords.latitude,
              lng: this.markerCoordinate()!.coords.longitude,
            },
          }),
        );
      } else {
        await this.map?.removeMarkers(this.addedMarkers);
        this.addedMarkers = [];
      }
    });
  }

  async ngAfterViewInit() {
    try {
      const apiKey = 'AIzaSyA6ju_iOEfLWsgZu2mf6cz-It1fDzTeVc8';
      const mapRef = document.getElementById('map');

      if (mapRef) {
        this.map = await GoogleMap.create({
          id: 'my-map', // Unique identifier for this map instance
          element: mapRef, // reference to the capacitor-google-map element
          apiKey: apiKey, // Your Google Maps API Key
          config: {
            center: {
              // The initial position to be rendered by the map
              lng: 28.1914,
              lat: -25.7566,
            },
            zoom: 8, // The initial zoom level to be rendered by the map
            androidLiteMode: true,
            disableDefaultUI: true,
          },
        });
        const markerId = await this.map.addMarker({
          coordinate: {
            lat: 33.6,
            lng: -117.9,
          },
        });
      }
    } catch (error) {
      alert(error);
    }
  }

  async ngOnDestroy() {
    await this.map?.destroy();
  }
}
