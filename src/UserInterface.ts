/**
 * @file UserInterface.js
 * @description Handles the UI parts of the web page.
 * @author Syeerus
 * @license MIT
 */

import { App } from "./App";
import { PlaylistModel } from "./PlaylistModel";
import { ElementsNotFoundException } from './Exceptions';

/**
 * @description Used for returning elements from the simple query function.
 */
interface SimpleQueryObject {
    multi: NodeListOf<Element>;
    single: Element;
}

/**
 * @description Uses a query selector to find one or more elements.
 * @throws {ElementsNotFoundException}
 */
function _$(selector: string, multiple: boolean = false): SimpleQueryObject {
    let find = null;
    if (!multiple) {
        find = document.querySelector(selector);
        if (!find) {
            throw new ElementsNotFoundException('Could not find element "' + selector + '"');
        }

        return { single: find, multi: null };
    }

    find = document.querySelectorAll(selector);
    if (find.length === 0) {
        throw new ElementsNotFoundException('Could not find any elements with the selector "' + selector + '"');
    }

    return { single: null, multi: find };
}

export class UserInterface {
    private static _instance: UserInterface;

    private _selStations: HTMLSelectElement;
    private _chkAllStations: HTMLInputElement;
    private _txtArtist: HTMLInputElement;
    private _txtSongTitle: HTMLInputElement;
    private _btnSearchSubmit: HTMLButtonElement;
    private _btnSearchClear: HTMLButtonElement;
    private _selLimit: HTMLSelectElement;

    private _playlistsTable: HTMLTableElement;
    private _playlistsPagination: HTMLDivElement;
    private _playlistsPaginationPrev: HTMLElement;
    private _playlistsPaginationNext: HTMLElement;

    private _isActive: boolean = false;

    private _pageNumber: number = 0;

    private constructor() {
    }

    /**
     * @description Returns the instance of the class.
     */
    public static getInstance(): UserInterface {
        if (!UserInterface._instance) {
            UserInterface._instance = new UserInterface();
        }

        return UserInterface._instance;
    }

    /**
     * @description Destroys the instance of the class.
     */
    public static destroyInstance() {
        UserInterface._instance = null;
    }

    /**
     * @description Finds all of the user interface elements on the page.
     */
    public init() {
        this._isActive = false;

        try {
            this._selStations = <HTMLSelectElement>_$('#sel-stations').single;
            this._chkAllStations = <HTMLInputElement>_$('#chk-all-stations').single;
            this._txtArtist = <HTMLInputElement>_$('#txt-artist').single;
            this._txtSongTitle = <HTMLInputElement>_$('#txt-song-title').single;
            this._btnSearchSubmit = <HTMLButtonElement>_$('#btn-search-submit').single;
            this._btnSearchClear = <HTMLButtonElement>_$('#btn-search-clear').single;
            this._selLimit = <HTMLSelectElement>_$('#sel-limit').single;

            this._playlistsTable = <HTMLTableElement>_$('#playlists-table').single;
            this._playlistsPagination = <HTMLDivElement>_$('#playlists-pagination').single;
            this._playlistsPaginationPrev = <HTMLElement>_$('#playlists-pagination-next').single;
            this._playlistsPaginationNext = <HTMLElement>_$('#playlists-pagination-next').single;

            this._populateSelStations();
            this._setupEventListeners();
            this._enableSearchForm(true);

            // Refreshing keeps the box checked
            this._selectAllStations(this._chkAllStations.checked);
        }
        catch (e) {
            console.log(e);
        }
    }

    /**
     * @description Populates the stations select box.
     */
    private _populateSelStations() {
        let data = App.getInstance().getRadioData();
        if (data) {
            for (let station of data.stations) {
                let element = document.createElement('option');
                element.value = station.id;
                element.text = station.name;
                this._selStations.appendChild(element);
            }
        }
    }

    /**
     * @description Sets up the event listeners for the UI elements.
     */
    private _setupEventListeners() {
        this._chkAllStations.addEventListener('change', this._onChkAllStationsChange.bind(this));
        this._btnSearchSubmit.addEventListener('click', this._onBtnSearchSubmitClick.bind(this));
        this._btnSearchClear.addEventListener('click', this._onBtnSearchClearClick.bind(this));
    }

    /**
     * @description Enables or disables the search form.
     */
    private _enableSearchForm(enabled: boolean) {
        let disabled = !enabled;
        this._selStations.disabled = disabled;
        this._chkAllStations.disabled = disabled;
        this._txtArtist.disabled = disabled;
        this._txtSongTitle.disabled = disabled;
        this._btnSearchSubmit.disabled = disabled;
        this._btnSearchClear.disabled = disabled;
        this._selLimit.disabled = disabled;
    }

    /**
     * @description Selects or deselects all stations.
     */
    private _selectAllStations(selected: boolean) {
        for (let i=0; i<this._selStations.options.length; ++i) {
            this._selStations.options[i].selected = selected;
        }
    }

    /**
     * @description Returns the values of the selected indices.
     */
    private _getSelectedStations(): Array<number> {
        let selected = [];
        for (let i=0; i<this._selStations.options.length; ++i) {
            if (this._selStations.options[i].selected) {
                selected.push(parseInt(this._selStations.options[i].value, 10));
            }
        }
        return selected;
    }

    private _onChkAllStationsChange() {
        this._selectAllStations(this._chkAllStations.checked);
    }

    private _onBtnSearchSubmitClick() {
        let station_ids = this._getSelectedStations();
        let artist_name = '%' + this._txtArtist.value + '%';
        let song_title = '%' + this._txtSongTitle.value + '%';
        let limit = parseInt(this._selLimit.value, 10) || 25;
        let offset = 0;
        this._pageNumber = 0;
        let total_records = PlaylistModel.getInstance().searchTotal(station_ids, artist_name, song_title);
        let records = PlaylistModel.getInstance().search(station_ids, artist_name, song_title, limit, offset);
    }

    private _onBtnSearchClearClick() {
        this._selectAllStations(false);
        this._txtArtist.value = '';
        this._txtSongTitle.value = '';
        this._chkAllStations.checked = false;
        this._selLimit.selectedIndex = 0;
    }

    /**
     * @description Creates and returns a new table.
     */
    private _createTable(id: string, headers: Array<string>, fields: Array<string>, data: Array<any>): HTMLTableElement {
        let table = document.createElement('table');
        table.id = id;
        table.classList.add('table', 'table-striped', 'table-hover');
        let thead = document.createElement('thead');
        let tr = document.createElement('tr');
        for (let label of headers) {
            let th = document.createElement('th');
            th.textContent = label;
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        table.appendChild(thead);

        let tbody = document.createElement('tbody');
        for (let row of data) {
            tr = document.createElement('tr');
            for (let f of fields) {
                let td = document.createElement('td');
                td.textContent = row[f];
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        return table;
    }

}
