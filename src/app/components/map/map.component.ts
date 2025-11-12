import { CommonModule, DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, EventEmitter, input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Geolocation, Position } from '@capacitor/geolocation';
import {
  IonCard,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonInput,
  IonModal,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { Marker } from 'leaflet';

@Component({
  standalone: true,
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [
    IonSkeletonText,
    IonCard,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonInput,
    IonIcon,
    FormsModule,
    CommonModule,
  ],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MapComponent implements OnInit {
  @Output() modalClosed: EventEmitter<boolean> = new EventEmitter<boolean>();

  loading: boolean = false;
  showMap: boolean = false;
  isMapLoaded: boolean = false;
  saveCurrentLocation: boolean = false;
  leafletMap: any;
  addedMarkers: Marker<any>[] = [];
  currentMarker: L.Marker<any> | undefined = undefined;
  markerCoordinate = input<Position[] | undefined>();
  editable = input.required<boolean>();

  constructor(private datePipe: DatePipe) {
    effect(async () => {
      this.addedMarkers.map((marker) => {
        this.removePin(marker);
      });

      if (this.markerCoordinate() !== undefined) {
        const interval = setInterval(() => {
          if (this.isMapLoaded) {
            this.markerCoordinate()!.map((location) => {
              this.addPin(location);
            });

            clearInterval(interval);
          }
        }, 500);
      }
    });
  }

  async ngOnInit() {
    this.showMap = true;
    setTimeout(() => {
      this.leafletMap = new L.Map('leafletMap');
      this.leafletMap.setView([-25.7566, 28.1914], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href=”https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.leafletMap);

      this.isMapLoaded = true;
      this.leafletMap.doubleClickZoom.disable();

      this.leafletMap.on('dblclick', (e: any) => {
        var location: Position = {
          coords: {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            accuracy: 0,
            altitude: 0,
            altitudeAccuracy: 0,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        };

        this.saveCurrentLocation = false;
        this.removePin(this.currentMarker);
        this.currentMarker = this.addPin(location);
      });
    }, 1000);
  }

  addPin(location: Position): L.Marker<any> {
    let icon = L.icon({
      iconUrl: 'assets/images/pin.png',
      iconSize: [27, 40],
    });

    const date = new Date(location.timestamp);
    const dateStr = this.datePipe.transform(date, 'yyyy-MM-dd');

    const marker = L.marker([location.coords.latitude, location.coords.longitude], { icon: icon }).addTo(
      this.leafletMap,
    );
    const popup = L.popup().setContent(`<p>${dateStr}</p>`);

    this.addedMarkers.push(marker);
    marker.bindPopup(popup);
    return marker;
  }

  removePin(marker: Marker<any> | undefined) {
    if (marker) {
      this.leafletMap.removeLayer(marker);
      this.addedMarkers.splice(this.addedMarkers.indexOf(marker), 1);
    } else {
      console.warn('Marker not found at specified location');
    }
  }

  async locationToggleChanged(saveLocation: boolean): Promise<void> {
    this.loading = true;
    this.saveCurrentLocation = saveLocation;
    if (!saveLocation) {
      this.removePin(this.currentMarker!);
    } else {
      if ((await Geolocation.checkPermissions()).location !== 'granted') {
        try {
          await Geolocation.requestPermissions();
        } catch (ex) {
          alert(ex);
        }
      }
      this.removePin(this.currentMarker);
      this.currentMarker = this.addPin(await Geolocation.getCurrentPosition());
    }
    this.loading = false;
  }
}
