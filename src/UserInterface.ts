/**
 * @file UserInterface.js
 * @description Handles the UI parts of the web page.
 * @author Syeerus
 * @license MIT
 */

import { App } from "./App";
import { ElementsNotFoundException } from './Exceptions';

/**
 * @description Used for returning elementss from the simple query function.
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

    private _onChkAllStationsChange() {
        this._selectAllStations(this._chkAllStations.checked);
    }

    private _onBtnSearchSubmitClick() {
    }

    private _onBtnSearchClearClick() {
        this._selectAllStations(false);
        this._txtArtist.value = '';
        this._txtSongTitle.value = '';
        this._chkAllStations.checked = false;
        this._selLimit.selectedIndex = 0;
    }
}
