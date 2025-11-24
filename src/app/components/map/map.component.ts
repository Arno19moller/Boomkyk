import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Geolocation, Position } from '@capacitor/geolocation';
import {
  DatetimeChangeEventDetail,
  IonButton,
  IonCard,
  IonCardHeader,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonModal,
  IonPopover,
  IonSkeletonText,
  IonTextarea,
  IonToggle,
} from '@ionic/angular/standalone';
import { IonDatetimeCustomEvent } from '@ionic/core';
import { Guid } from 'guid-typescript';
import * as L from 'leaflet';
import { Marker } from 'leaflet';
import { Pin } from 'src/app/models/pin.interface';
import { PopupComponent } from '../popup/popup.component';

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
    IonPopover,
    IonButton,
    PopupComponent,
  ],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() modalClosed: EventEmitter<Pin[]> = new EventEmitter<Pin[]>();

  editable = input.required<boolean>();
  pins = input.required<Pin[]>();
  selectedPin = input<Pin | undefined>();

  mapPins: Pin[] = [];
  leafletMap: any;
  loading: boolean = false;
  showMap: boolean = false;
  isMapLoaded: boolean = false;
  saveCurrentLocation: boolean = false;
  notes: string = '';
  dateString: string = new Date().toISOString();

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
  mapMarkers: L.Marker<any>[] = [];
  currentMarker: L.Marker<any> | undefined = undefined;
  newMarker: L.Marker<any> | undefined = undefined;

  protected openConfirmDelete = signal<boolean>(false);
  protected confirmDeleteBody: string = '';

  constructor(private datePipe: DatePipe) {}

  async ngOnInit() {
    this.currentPin = this.newPin;
    this.showMap = true;
    await this.checkAndRequestLocation();
    this.mapMarkers.map((marker) => {
      this.removePin(marker);
    });
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

    this.loadPins();
  }

  loadPins() {
    this.mapPins = [...this.pins()];
    this.pins()!
      .filter((p) => p.position)
      .map((pin) => {
        this.addPin(pin.position!, pin);
      });

    if (this.selectedPin() != undefined) {
      const marker = this.mapMarkers.find((m) => this.isMarkerEqualToPin(m, this.selectedPin()!));
      this.selectMarker(marker);
    }
  }

  loadMapEvents(): void {
    this.leafletMap.on('contextmenu', (e: L.LeafletMouseEvent) => {
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
      this.removePin(this.newMarker);
      this.addPin(location);
      this.newMarker = this.mapMarkers[this.mapMarkers.length - 1];
    });

    // click anywhere but on pin
    this.leafletMap.on('click', (e: L.LeafletMouseEvent) => {
      this.unselectmarker();
    });
  }

  addPin(location: Position, existingPin: Pin | undefined = undefined) {
    const icon = this.getIcon(existingPin ? 'default' : 'selected');
    const marker = L.marker([location.coords.latitude, location.coords.longitude], { icon: icon }).addTo(
      this.leafletMap,
    );
    marker.on('click', this.onMarkerClick, this);

    const dateStr = this.datePipe.transform(new Date(), 'dd MMM yyyy');
    const popup = L.popup().setContent(`<p>${dateStr}</p>`);

    this.mapMarkers.push(marker);
    marker.bindPopup(popup);

    // New pin
    if (existingPin === undefined) {
      this.currentMarker = marker;

      const date = new Date(location.timestamp);
      this.currentPin = this.newPin;
      this.currentPin.date = date;
      this.currentPin.position = location;
      this.currentPin.notes = this.currentPin.notes;
      this.configurePinContent(this.currentMarker!, this.currentPin);
      this.mapPins.push(this.newPin);
    }
    // Saved pins when map loads
    else {
      this.configurePinContent(marker, existingPin);
    }
  }

  onMarkerClick(e: L.LeafletMouseEvent) {
    const clickedMarker = e.target as L.Marker;
    const index = this.mapMarkers.indexOf(clickedMarker);

    this.selectMarker(this.mapMarkers[index]);
  }

  removePin(marker: Marker<any> | undefined) {
    if (marker) {
      const pin = this.getCurrentPin();
      const index = this.mapPins.indexOf(pin!);
      this.mapPins = this.mapPins.filter((_, i) => i !== index);

      this.leafletMap.removeLayer(marker);
      this.mapMarkers.splice(this.mapMarkers.indexOf(marker), 1);
    } else {
      console.warn('Marker not found at specified location');
    }
  }

  async locationToggleChanged(saveLocation: boolean): Promise<void> {
    if (this.saveCurrentLocation == saveLocation) return;

    this.loading = true;
    this.saveCurrentLocation = saveLocation;
    if (!saveLocation) {
      this.removePin(this.newMarker!);
      this.currentMarker = undefined;
    } else {
      this.removePin(this.newMarker);
      this.addPin(await Geolocation.getCurrentPosition());
      this.newMarker = this.mapMarkers[this.mapMarkers.length - 1];
    }
    this.loading = false;
  }

  notesChanged(): void {
    this.currentPin.notes = this.notes;
    this.configurePinContent(this.currentMarker!, this.currentPin);
  }

  dateTimeChanged($event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>) {
    const value = $event.target.value;
    if (typeof value === 'string') {
      const newDate = new Date(value!);
      this.currentPin.date = newDate;
      this.configurePinContent(this.currentMarker!, this.currentPin);
    }
  }

  selectMarker(marker: L.Marker<any> | undefined) {
    if (marker == undefined) return;

    this.currentMarker = marker;
    this.mapMarkers.map((m) => {
      const isNewMark = this.isMarkerEqualToPin(m);
      const icon = this.getIcon(isNewMark ? 'new' : 'default');
      m.setIcon(icon);
    });

    const icon = this.getIcon('selected');
    marker.setIcon(icon);

    const pin = this.getCurrentPin();
    this.currentPin = pin ? pin : this.newPin;
    this.notes = this.currentPin.notes;
    this.dateString = this.currentPin.date.toISOString();
  }

  unselectmarker(): void {
    const icon = this.getIcon(this.newPin.position === this.currentPin.position ? 'new' : 'default');
    this.currentMarker?.setIcon(icon);
    this.currentMarker = undefined;
    this.notes = '';
    this.dateString = new Date().toISOString();
  }

  deleteClicked() {
    this.confirmDeleteBody = `Are you sure you want to delete the pin?`;
    this.openConfirmDelete.set(true);
  }

  deletePopupClosed(role: string) {
    if (role === 'confirm') {
      if (this.isMarkerEqualToPin(this.currentMarker)) {
        this.saveCurrentLocation = false;
      }
      this.removePin(this.currentMarker);
      this.unselectmarker();
    }
  }

  private configurePinContent(marker: L.Marker<any>, pin: Pin): void {
    const dateStr = this.datePipe.transform(pin.date, 'dd MMM yyyy');
    marker.setPopupContent(`<h6>${dateStr}</h6><sub>${pin.notes}</sub>`);
  }

  private isMarkerEqualToPin(marker: L.Marker<any> | undefined, pin?: Pin): boolean {
    if (!marker) return false;

    pin = pin ?? this.newPin;

    const position = marker.getLatLng();
    const pinPosition = pin.position?.coords;
    return position.lat === pinPosition?.latitude && position.lng === pinPosition?.longitude;
  }

  private getIcon(type: 'new' | 'selected' | 'default'): L.Icon<L.IconOptions> {
    let url = 'assets/images/';
    url += type === 'new' ? 'pinNew.png' : type === 'selected' ? 'pinSelected.png' : 'pin.png';

    return L.icon({
      iconUrl: url,
      iconSize: [27, 40],
    });
  }

  private getCurrentPin(): Pin | undefined {
    const currLatLang = this.currentMarker?.getLatLng();
    return this.pins().find((p) => {
      const pinLatLang = p.position?.coords;
      return currLatLang?.lat === pinLatLang?.latitude && currLatLang?.lng === pinLatLang?.longitude;
    });
  }

  ngOnDestroy(): void {}
}
