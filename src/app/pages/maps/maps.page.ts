import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, effect, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Position } from '@capacitor/geolocation';
import { IonCard, IonContent, IonHeader, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { Marker } from 'leaflet';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonSkeletonText, CommonModule, FormsModule],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MapsPage implements AfterViewInit {
  isMapLoaded: boolean = false;
  leafletMap: any;
  addedMarkers: Marker<any>[] = [];
  markerCoordinate = input<Position[] | undefined>();

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

  async ngAfterViewInit() {
    setTimeout(() => {
      this.loadLeafletMap();
      this.isMapLoaded = true;
    }, 1000);
  }

  loadLeafletMap() {
    this.leafletMap = new L.Map('leafletMap');
    this.leafletMap.setView([-25.7566, 28.1914], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href=”https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.leafletMap);
  }

  addPin(location: Position) {
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
  }

  removePin(marker: Marker<any>) {
    if (marker) {
      this.leafletMap.removeLayer(marker);
      this.addedMarkers.splice(this.addedMarkers.indexOf(marker), 1);
    } else {
      console.warn('Marker not found at specified location');
    }
  }
}
