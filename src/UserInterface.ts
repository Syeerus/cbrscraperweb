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
    private _dateStart: HTMLInputElement;
    private _dateEnd: HTMLInputElement;
    private _btnSearchSubmit: HTMLButtonElement;
    private _btnSearchClear: HTMLButtonElement;
    private _selLimit: HTMLSelectElement;

    private _playlistsPagination: HTMLDivElement;
    private _playlistsPaginationPrev: HTMLElement;
    private _playlistsPaginationNext: HTMLElement;

    private _opt100MostPlayedSongs: HTMLInputElement;
    private _opt100MostPlayedArtists: HTMLInputElement;
    private _opt100MostPlayedChristmas: HTMLInputElement;

    private _pageNumber: number = 0;
    private _lastPageNumber: number;

    private _onPaginationLinkClickCallback = this._onPaginationLinkClick.bind(this);

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
        try {
            this._selStations = <HTMLSelectElement>_$('#sel-stations').single;
            this._chkAllStations = <HTMLInputElement>_$('#chk-all-stations').single;
            this._txtArtist = <HTMLInputElement>_$('#txt-artist').single;
            this._txtSongTitle = <HTMLInputElement>_$('#txt-song-title').single;
            this._dateStart = <HTMLInputElement>_$('#date-start').single;
            this._dateEnd = <HTMLInputElement>_$('#date-end').single;
            this._btnSearchSubmit = <HTMLButtonElement>_$('#btn-search-submit').single;
            this._btnSearchClear = <HTMLButtonElement>_$('#btn-search-clear').single;
            this._selLimit = <HTMLSelectElement>_$('#sel-limit').single;

            this._playlistsPagination = <HTMLDivElement>_$('#playlists-pagination').single;
            this._playlistsPaginationPrev = <HTMLElement>_$('#playlists-pagination-prev').single;
            this._playlistsPaginationNext = <HTMLElement>_$('#playlists-pagination-next').single;

            this._opt100MostPlayedSongs = <HTMLInputElement>_$('#opt-100-most-played-songs').single;
            this._opt100MostPlayedArtists = <HTMLInputElement>_$('#opt-100-most-played-artists').single;
            this._opt100MostPlayedChristmas = <HTMLInputElement>_$('#opt-100-most-played-christmas').single;

            this._populateSelStations();
            this._setupEventListeners();
            this._enableControls(true);
            this._populateStationOptions();

            let data = App.getInstance().getRadioData();
            (<HTMLElement>_$('#data-stats').single).textContent = 'Loaded: ' + data.stations.length + ' stations, ' +
                data.artists.length + ' artists, ' + data.songs.length + ' songs, ' + data.playlists.length + ' playlist entries';

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

    private _populateStationOptions() {
        let div = _$('#opt-stations').single;
        let stations = App.getInstance().getRadioData().stations;
        for (let s of stations) {
            let label = <HTMLLabelElement>document.createElement('label');
            label.htmlFor = 'opt-station-' + s.id;
            label.className = 'form-radio';

            let option = document.createElement('input');
            option.id = label.htmlFor;
            option.type = 'radio';
            option.name = 'opt-station';
            option.value = s.id;
            option.addEventListener('change', this._onDataSelectionChange.bind(this));
            label.appendChild(option);

            let i = document.createElement('i');
            i.className = 'form-icon';
            label.appendChild(i);

            let text = document.createTextNode(s.name);
            label.appendChild(text);
            div.appendChild(label);
        }
    }

    /**
     * @description Sets up the event listeners for the UI elements.
     */
    private _setupEventListeners() {
        this._chkAllStations.addEventListener('change', this._onChkAllStationsChange.bind(this));
        this._btnSearchSubmit.addEventListener('click', this._onBtnSearchSubmitClick.bind(this));
        this._btnSearchClear.addEventListener('click', this._onBtnSearchClearClick.bind(this));

        this._opt100MostPlayedArtists.addEventListener('change', this._onDataSelectionChange.bind(this));
        this._opt100MostPlayedSongs.addEventListener('change', this._onDataSelectionChange.bind(this));
        this._opt100MostPlayedChristmas.addEventListener('change', this._onDataSelectionChange.bind(this));
    }

    /**
     * @description Enables or disables the UI controls.
     */
    private _enableControls(enabled: boolean) {
        let disabled = !enabled;
        this._selStations.disabled = disabled;
        this._chkAllStations.disabled = disabled;
        this._txtArtist.disabled = disabled;
        this._txtSongTitle.disabled = disabled;
        this._dateStart.disabled = disabled;
        this._dateEnd.disabled = disabled;
        this._btnSearchSubmit.disabled = disabled;
        this._btnSearchClear.disabled = disabled;
        this._selLimit.disabled = disabled;

        this._opt100MostPlayedSongs.disabled = disabled;
        this._opt100MostPlayedArtists.disabled = disabled;
        this._opt100MostPlayedChristmas.disabled = disabled;
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
        this._performSearch();
    }

    private _onBtnSearchClearClick() {
        this._selectAllStations(false);
        this._txtArtist.value = '';
        this._txtSongTitle.value = '';
        this._dateStart.value = '';
        this._dateEnd.value = '';
        this._chkAllStations.checked = false;
        this._selLimit.selectedIndex = 0;
    }

    private _onDataSelectionChange() {
        let station_id = (<RadioNodeList>document.forms[0].elements.namedItem('opt-station')).value;
        let data_selection = (<RadioNodeList>document.forms[0].elements.namedItem('opt-data-selection')).value;

        if (station_id !== '' && data_selection !== '') {
            let station_id_int = parseInt(station_id, 10);
            let data = null;
            let headers: Array<string> = [];
            let fields: Array<string> = [];
            switch (data_selection) {
                case '100_mp_songs':
                    data = PlaylistModel.getInstance().getMostPlayedSongs(station_id_int, 100);
                    headers = ['Count', 'Artist', 'Song Title'];
                    fields = ['play_count', 'artist_name', 'song_title'];
                    break;
                case '100_mp_artists':
                    data = PlaylistModel.getInstance().getMostPlayedArtists(station_id_int, 100);
                    headers = ['Count', 'Artist'];
                    fields = ['play_count', 'artist_name'];
                    break;
                case '100_mp_christmas':
                    data = PlaylistModel.getInstance().getMostPlayedChristmasSongs(station_id_int, 100);
                    headers= ['Count', 'Artist', 'Song Title'];
                    fields = ['play_count', 'artist_name', 'song_title'];
                    break;
            }

            if (data !== null) {
                let table = document.getElementById('data-table');
                if (table) {
                    table.parentElement.removeChild(table);
                }

                table = this._createTable('data-table', headers, fields, data);
                _$('#data-table-container').single.appendChild(table);
            }
        }
    }

    private _performSearch(reset_page_num: boolean = true) {
        if (reset_page_num)
            this._pageNumber = 0;

        let station_ids = this._getSelectedStations();
        let artist_name = '%' + this._txtArtist.value + '%';
        let song_title = '%' + this._txtSongTitle.value + '%';
        let start_date = this._dateStart.valueAsNumber;
        if (isNaN(start_date))
            start_date = 0;
        else
            start_date = start_date / 1000;     // Convert to seconds

        let end_date = this._dateEnd.valueAsNumber;
        if (isNaN(end_date))
            end_date = Math.floor((new Date()).getTime() / 1000);
        else
            end_date = end_date / 1000;         // Convert to seconds

        let limit = parseInt(this._selLimit.value, 10) || 25;
        let offset = this._pageNumber * limit;
        let total_records = PlaylistModel.getInstance().searchTotal(station_ids, artist_name, song_title, start_date, end_date);
        let records = PlaylistModel.getInstance().search(station_ids, artist_name, song_title, start_date, end_date, limit, offset);
        for (let i=0; i<records.length; ++i) {
            // Refine the date to a time string
            records[i].timestamp = (new Date(records[i].timestamp * 1000)).toUTCString();
        }

        _$('#results').single.textContent = total_records + " results";

        let total_pages = Math.ceil(total_records / limit);
        this._lastPageNumber = (total_pages > 0) ? total_pages - 1 : 0;

        let table = document.getElementById('playlists-table');
        if (table)
            table.parentElement.removeChild(table);

        table = this._createTable('playlists-table', ['Station', 'Artist', 'Song Title', 'Time'], ['station_name', 'artist_name', 'song_title', 'timestamp'], records);
        _$('#playlist-table-container').single.appendChild(table);

        this._generatePaginationTable(total_pages);
    }

    private _generatePaginationTable(total_pages: number) {
        this._playlistsPagination.classList.remove('hidden');
        let elements = Array.prototype.slice.call(this._playlistsPagination.children);
        for (let e of elements) {
            if (e !== this._playlistsPaginationPrev && e !== this._playlistsPaginationNext) {
                this._playlistsPagination.removeChild(e);
            }
        }

        for (let i=0; i<total_pages; ++i) {
            let e = document.createElement('li');
            e.classList.add('page-item');
            if (i === this._pageNumber)
                e.classList.add('active');
            let a = document.createElement('a');
            let num_str = (i + 1).toString();
            a.href = '#';
            a.onclick = function() { return false; };
            a.dataset.page = num_str;
            a.textContent = num_str;
            a.addEventListener('click', this._onPaginationLinkClickCallback);
            e.appendChild(a);
            this._playlistsPaginationNext.before(e);
        }

        if (this._pageNumber === 0) {
            this._playlistsPaginationPrev.classList.add('disabled');
            _$('a[data-page="-1"]').single.removeEventListener('click', this._onPaginationLinkClickCallback);
            if (total_pages > 1) {
                this._playlistsPaginationNext.classList.remove('disabled');
                _$('a[data-page="-2"]').single.addEventListener('click', this._onPaginationLinkClickCallback);
            }
            else {
                this._playlistsPaginationNext.classList.add('disabled');
                _$('a[data-page="-2"]').single.removeEventListener('click', this._onPaginationLinkClickCallback);
            }
        }
        else {
            this._playlistsPaginationPrev.classList.remove('disabled');
            _$('a[data-page="-1"]').single.addEventListener('click', this._onPaginationLinkClickCallback);
            if (this._pageNumber === total_pages - 1) {
                this._playlistsPaginationNext.classList.add('disabled');
                _$('a[data-page="-2"]').single.removeEventListener('click', this._onPaginationLinkClickCallback);
            }
            else {
                this._playlistsPaginationNext.classList.remove('disabled');
                _$('a[data-page="-2"]').single.addEventListener('click', this._onPaginationLinkClickCallback);
            }
        }
    }

    private _onPaginationLinkClick(e: Event) {
        let page = parseInt((<HTMLElement>e.target).dataset.page, 10) || 0;
        if (page === -1 && this._pageNumber > 0) {
            --this._pageNumber;
        }
        else if (page === -2 && this._pageNumber < this._lastPageNumber) {
            ++this._pageNumber;
        }
        else {
            if (page < 1) {
                this._pageNumber = 0;
            }
            else if (page > this._lastPageNumber + 1) {
                this._pageNumber  = this._lastPageNumber;
            }
            else {
                this._pageNumber = page - 1;
            }
        }

        this._performSearch(false);
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
