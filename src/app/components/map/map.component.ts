import { CommonModule, DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, EventEmitter, input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Geolocation, Position } from '@capacitor/geolocation';
import {
  DatetimeChangeEventDetail,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonModal,
  IonSkeletonText,
  IonTextarea,
  IonToggle,
} from '@ionic/angular/standalone';
import { IonDatetimeCustomEvent } from '@ionic/core';
import { Guid } from 'guid-typescript';
import * as L from 'leaflet';
import { Marker } from 'leaflet';
import { Pin } from 'src/app/models/pin.interface';

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
    IonTextarea,
    IonModal,
    IonToggle,
    IonIcon,
    FormsModule,
    CommonModule,
    IonCardHeader,
    IonCardContent,
  ],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MapComponent implements OnInit {
  @Output() modalClosed: EventEmitter<Pin> = new EventEmitter<Pin>();

  editable = input.required<boolean>();
  pins = input.required<Pin[]>();

  leafletMap: any;
  loading: boolean = false;
  showMap: boolean = false;
  isMapLoaded: boolean = false;
  saveCurrentLocation: boolean = false;
  notes: string = '';

  currentPin: Pin = {
    id: Guid.create(),
    date: new Date(),
    notes: '',
  };
  newPin: Pin = {
    id: Guid.create(),
    date: new Date(),
    notes: '',
  };
  mapMarkers: Marker<any>[] = [];
  currentMarker: L.Marker<any> | undefined = undefined;

  constructor(private datePipe: DatePipe) {
    effect(async () => {
      this.mapMarkers.map((marker) => {
        this.removePin(marker);
      });

      if (this.pins() !== undefined) {
        const interval = setInterval(() => {
          if (this.isMapLoaded && this.pins()?.some((p) => p.position)) {
            this.pins()!
              .filter((p) => p.position)
              .map((pin) => {
                this.addPin(pin.position!, pin);
              });

            clearInterval(interval);
          }
        }, 1500);
      }
    });
  }

  async ngOnInit() {
    this.currentPin = this.newPin;
    this.showMap = true;
    await this.checkAndRequestLocation();
  }

  async checkAndRequestLocation() {
    let alertShowed = false;
    let intervalId = setInterval(async () => {
      try {
        if (!this.editable()) {
          this.loadMap();
          this.loadMapEvents();
        } else {
          await Geolocation.requestPermissions();
          this.loadMap();
          this.loadMapEvents();
        }
        clearInterval(intervalId);
      } catch (err) {
        if (!alertShowed) {
          alert('Location disabled. Please enable Location to use this feature');
          alertShowed = true;
        }
      }
    }, 1000);
  }

  loadMap(): void {
    this.leafletMap = new L.Map('leafletMap');
    this.leafletMap.setView([-25.7566, 28.1914], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href=”https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.leafletMap);
    this.isMapLoaded = true;
  }

  loadMapEvents(): void {
    this.leafletMap.on('contextmenu', (e: any) => {
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
      this.addPin(location);
    });
  }

  addPin(location: Position, existingPin: Pin | undefined = undefined) {
    let icon = L.icon({
      iconUrl: existingPin ? 'assets/images/pin.png' : 'assets/images/pinNew.png',
      iconSize: [27, 40],
    });

    const marker = L.marker([location.coords.latitude, location.coords.longitude], { icon: icon }).addTo(
      this.leafletMap,
    );
    marker.on('click', this.onMarkerClick, this);

    const dateStr = this.datePipe.transform(new Date(), 'dd MMM yyyy');
    const popup = L.popup().setContent(`<p>${dateStr}</p>`);

    this.mapMarkers.push(marker);
    marker.bindPopup(popup);

    if (existingPin === undefined) {
      this.currentMarker = marker;

      const date = new Date(location.timestamp);
      this.currentPin = this.newPin;
      this.currentPin.date = date;
      this.currentPin.position = location;
      this.currentPin.notes = this.currentPin.notes;
      this.configurePinContent(this.currentMarker!, this.currentPin);
    } else {
      this.configurePinContent(marker, existingPin);
    }
  }

  onMarkerClick(e: L.LeafletMouseEvent) {
    const clickedMarker = e.target as L.Marker;
    const index = this.mapMarkers.indexOf(clickedMarker);
    this.currentMarker = this.mapMarkers[index];

    this.mapMarkers.map((m) => {
      const mark = m.getLatLng();
      const newMark = this.newPin.position?.coords;
      const isNewMark = mark.lat === newMark?.latitude && mark.lng === newMark?.longitude;
      const icon = L.icon({
        iconUrl: isNewMark ? 'assets/images/pinNew.png' : 'assets/images/pin.png',
        iconSize: [27, 40],
      });
      m.setIcon(icon);
    });

    const icon = L.icon({
      iconUrl: 'assets/images/pinSelected.png',
      iconSize: [27, 40],
    });
    this.currentMarker.setIcon(icon);

    const currLatLang = this.currentMarker?.getLatLng();
    const pin = this.pins().find((p) => {
      const pinLatLang = p.position?.coords;
      return currLatLang?.lat === pinLatLang?.latitude && currLatLang?.lng === pinLatLang?.longitude;
    });

    if (pin) {
      this.currentPin = pin;
    } else {
      this.currentPin = this.newPin;
    }
    this.notes = this.currentPin.notes;
  }

  removePin(marker: Marker<any> | undefined) {
    if (marker) {
      this.leafletMap.removeLayer(marker);
      this.mapMarkers.splice(this.mapMarkers.indexOf(marker), 1);
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
      this.addPin(await Geolocation.getCurrentPosition());
    }
    this.loading = false;
  }

  notesChanged(): void {
    this.currentPin.notes = this.notes;
    this.configurePinContent(this.currentMarker!, this.currentPin);
  }

  dateTimeChanged($event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>) {
    alert(this.currentPin.date);
    const value = $event.target.value;
    if (typeof value === 'string') {
      const newDate = new Date(value!);
      this.currentPin.date = newDate;
      this.configurePinContent(this.currentMarker!, this.currentPin);
    }
  }

  doneClicked(): void {
    let icon = L.icon({
      iconUrl: this.newPin.position === this.currentPin.position ? 'assets/images/pinNew.png' : 'assets/images/pin.png',
      iconSize: [27, 40],
    });
    this.currentMarker?.setIcon(icon);
    this.currentMarker = undefined;
    this.notes = '';
  }

  private configurePinContent(marker: L.Marker<any>, pin: Pin): void {
    const dateStr = this.datePipe.transform(pin.date, 'dd MMM yyyy');
    marker.setPopupContent(`<h6>${dateStr}</h6><sub>${pin.notes}</sub>`);
  }
}
