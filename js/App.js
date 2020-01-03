(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UserInterface_1 = require("./UserInterface");
var App = (function () {
    function App() {
        this._radioData = null;
        this._dataTransferAttempts = 0;
    }
    App.getInstance = function () {
        if (!App._instance) {
            App._instance = new App();
        }
        return App._instance;
    };
    App.destroyInstance = function () {
        App._instance = null;
    };
    App.prototype.getRadioData = function () {
        return this._radioData;
    };
    App.prototype.init = function () {
        this._startDataFileTransfer();
    };
    App.prototype._startDataFileTransfer = function () {
        ++this._dataTransferAttempts;
        console.log("Data file download attempt #" + this._dataTransferAttempts);
        var xhr = new XMLHttpRequest();
        var on_data_file_transfer_failure = this._onDataFileTransferFailure.bind(this, xhr);
        xhr.addEventListener('load', this._onDataFileLoaded.bind(this, xhr));
        xhr.addEventListener('error', on_data_file_transfer_failure);
        xhr.addEventListener('abort', on_data_file_transfer_failure);
        xhr.open('GET', App.DATA_FILE);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    };
    App.prototype._onDataFileLoaded = function (xhr) {
        if (xhr.status === 200) {
            var data = new Uint8Array(xhr.response);
            var blob_url_1 = window.URL.createObjectURL(new Blob([document.querySelector('#decompress-worker').textContent]));
            var worker_1 = new Worker(blob_url_1);
            var app_1 = this;
            worker_1.onmessage = function (e) {
                try {
                    var decoder = new TextDecoder();
                    app_1._radioData = JSON.parse(decoder.decode(e.data));
                    console.log('Data file successfully parsed.');
                }
                catch (e) {
                    console.log(e);
                }
                window.URL.revokeObjectURL(blob_url_1);
                worker_1.terminate();
                UserInterface_1.UserInterface.getInstance().init();
            };
            worker_1.onerror = function (e) {
                console.log('An error occured: ', e);
            };
            var url = document.location.href;
            var index = url.indexOf('index.html');
            if (index > -1) {
                url = url.substring(0, index);
            }
            worker_1.postMessage({ data: data, url: url });
        }
        else {
            console.log('Error downloading data file: ' + xhr.statusText);
        }
    };
    App.prototype._onDataFileTransferFailure = function (xhr) {
        console.log('An error occured while transferring the file.');
        console.log('Status: ', xhr.statusText);
        if (this._dataTransferAttempts < App.MAX_DATA_TRANSFER_ATTEMPTS) {
            this._startDataFileTransfer();
        }
    };
    App.DATA_FILE = 'cbrs.db.json.bz2';
    App.MAX_DATA_TRANSFER_ATTEMPTS = 3;
    return App;
}());
exports.App = App;
(function () {
    var app = App.getInstance();
    app.init();
}());

},{"./UserInterface":4}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ElementsNotFoundException = (function (_super) {
    __extends(ElementsNotFoundException, _super);
    function ElementsNotFoundException() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ElementsNotFoundException;
}(Error));
exports.ElementsNotFoundException = ElementsNotFoundException;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var App_1 = require("./App");
var PlaylistModel = (function () {
    function PlaylistModel() {
    }
    PlaylistModel.getInstance = function () {
        if (!PlaylistModel._instance) {
            PlaylistModel._instance = new PlaylistModel();
        }
        return PlaylistModel._instance;
    };
    PlaylistModel.destroyInstance = function () {
        PlaylistModel._instance = null;
    };
    PlaylistModel.prototype.searchTotal = function (station_ids, artist_name, song_title, start_date, end_date) {
        if (station_ids.length <= 0) {
            return 0;
        }
        var station_placeholders = '';
        for (var i = 0; i < station_ids.length; ++i)
            station_placeholders += '?,';
        var sql = "SELECT COUNT(*) AS total_records FROM ? AS playlists " +
            "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
            "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
            "INNER JOIN ? AS stations ON playlists.station_id = stations.id " +
            "WHERE playlists.station_id IN (" + station_placeholders.substring(0, station_placeholders.length - 1) + ") " +
            "AND artists.name LIKE ? " +
            "AND songs.title LIKE ? " +
            "AND playlists.timestamp >= ? " +
            "AND playlists.timestamp <= ?";
        var data = App_1.App.getInstance().getRadioData();
        var params = [data.playlists, data.songs, data.artists, data.stations].concat(station_ids).concat([artist_name, song_title, start_date, end_date]);
        var results = this._exec(sql, params);
        return results[0].total_records;
    };
    PlaylistModel.prototype.search = function (station_ids, artist_name, song_title, start_date, end_date, limit, offset) {
        if (station_ids.length <= 0) {
            return [];
        }
        var station_placeholders = '';
        for (var i = 0; i < station_ids.length; ++i)
            station_placeholders += '?,';
        var sql = "SELECT stations.name AS station_name, artists.name AS artist_name, songs.title AS song_title, playlists.timestamp AS timestamp FROM ? AS playlists " +
            "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
            "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
            "INNER JOIN ? AS stations ON playlists.station_id = stations.id " +
            "WHERE playlists.station_id IN (" + station_placeholders.substring(0, station_placeholders.length - 1) + ") " +
            "AND artists.name LIKE ? " +
            "AND songs.title LIKE ? " +
            "AND playlists.timestamp >= ? " +
            "AND playlists.timestamp <= ? " +
            "ORDER BY playlists.timestamp " +
            "LIMIT " + limit + " OFFSET " + offset;
        var data = App_1.App.getInstance().getRadioData();
        var params = [data.playlists, data.songs, data.artists, data.stations].concat(station_ids).concat([artist_name, song_title, start_date, end_date]);
        return this._exec(sql, params);
    };
    PlaylistModel.prototype.getMostPlayedSongs = function (station_id, limit) {
        var sql = "SELECT COUNT(*) AS play_count, FIRST(artists.name) AS artist_name, FIRST(songs.title) AS song_title FROM ? AS playlists " +
            "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
            "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
            "WHERE playlists.station_id = ? " +
            "GROUP BY playlists.song_id " +
            "ORDER BY play_count DESC " +
            "LIMIT " + limit;
        var data = App_1.App.getInstance().getRadioData();
        var params = [data.playlists, data.songs, data.artists, station_id];
        return this._exec(sql, params);
    };
    PlaylistModel.prototype.getMostPlayedArtists = function (station_id, limit) {
        var sql = "SELECT COUNT(*) AS play_count, FIRST(artists.name) AS artist_name FROM ? AS playlists " +
            "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
            "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
            "WHERE playlists.station_id = ? " +
            "GROUP BY songs.artist_id " +
            "ORDER BY play_count DESC " +
            "LIMIT " + limit;
        var data = App_1.App.getInstance().getRadioData();
        var params = [data.playlists, data.songs, data.artists, station_id];
        return this._exec(sql, params);
    };
    PlaylistModel.prototype.getMostPlayedChristmasSongs = function (station_id, limit) {
        var sql = "SELECT COUNT(*) AS play_count, FIRST(artists.name) AS artist_name, FIRST(songs.title) AS song_title FROM ? AS playlists " +
            "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
            "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
            "WHERE playlists.station_id = ? " +
            "AND (";
        var keywords = [
            "christmas", "jingle", "bells", "reindeer", "santa", "baby it's cold", "snow", "feliz navidad",
            "grandma got run over", "little drummer", "mary", "december", "winter", "let it snow", "frosty"
        ];
        for (var i = 0; i < keywords.length; ++i) {
            keywords[i] = '%' + keywords[i] + '%';
            sql += "songs.title LIKE ? ";
            if (i < keywords.length - 1) {
                sql += "OR ";
            }
        }
        sql += ") GROUP BY playlists.song_id " +
            "ORDER BY play_count DESC " +
            "LIMIT " + limit;
        var data = App_1.App.getInstance().getRadioData();
        var params = [data.playlists, data.songs, data.artists, station_id].concat(keywords);
        return this._exec(sql, params);
    };
    PlaylistModel.prototype._exec = function (sql, parameters) {
        if (sql === this._prevSql && this._prevStmt) {
            return this._prevStmt(parameters);
        }
        this._prevSql = sql;
        this._prevStmt = window.alasql.compile(sql);
        return this._prevStmt(parameters);
    };
    return PlaylistModel;
}());
exports.PlaylistModel = PlaylistModel;

},{"./App":1}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var App_1 = require("./App");
var PlaylistModel_1 = require("./PlaylistModel");
var Exceptions_1 = require("./Exceptions");
function _$(selector, multiple) {
    if (multiple === void 0) { multiple = false; }
    var find = null;
    if (!multiple) {
        find = document.querySelector(selector);
        if (!find) {
            throw new Exceptions_1.ElementsNotFoundException('Could not find element "' + selector + '"');
        }
        return { single: find, multi: null };
    }
    find = document.querySelectorAll(selector);
    if (find.length === 0) {
        throw new Exceptions_1.ElementsNotFoundException('Could not find any elements with the selector "' + selector + '"');
    }
    return { single: null, multi: find };
}
var UserInterface = (function () {
    function UserInterface() {
        this._pageNumber = 0;
        this._onPaginationLinkClickCallback = this._onPaginationLinkClick.bind(this);
    }
    UserInterface.getInstance = function () {
        if (!UserInterface._instance) {
            UserInterface._instance = new UserInterface();
        }
        return UserInterface._instance;
    };
    UserInterface.destroyInstance = function () {
        UserInterface._instance = null;
    };
    UserInterface.prototype.init = function () {
        try {
            this._selStations = _$('#sel-stations').single;
            this._chkAllStations = _$('#chk-all-stations').single;
            this._txtArtist = _$('#txt-artist').single;
            this._txtSongTitle = _$('#txt-song-title').single;
            this._dateStart = _$('#date-start').single;
            this._dateEnd = _$('#date-end').single;
            this._btnSearchSubmit = _$('#btn-search-submit').single;
            this._btnSearchClear = _$('#btn-search-clear').single;
            this._selLimit = _$('#sel-limit').single;
            this._playlistsPagination = _$('#playlists-pagination').single;
            this._playlistsPaginationPrev = _$('#playlists-pagination-prev').single;
            this._playlistsPaginationNext = _$('#playlists-pagination-next').single;
            this._opt100MostPlayedSongs = _$('#opt-100-most-played-songs').single;
            this._opt100MostPlayedArtists = _$('#opt-100-most-played-artists').single;
            this._opt100MostPlayedChristmas = _$('#opt-100-most-played-christmas').single;
            this._populateSelStations();
            this._setupEventListeners();
            this._enableControls(true);
            this._populateStationOptions();
            var data = App_1.App.getInstance().getRadioData();
            _$('#data-stats').single.textContent = 'Loaded: ' + data.stations.length + ' stations, ' +
                data.artists.length + ' artists, ' + data.songs.length + ' songs, ' + data.playlists.length + ' playlist entries';
            this._selectAllStations(this._chkAllStations.checked);
        }
        catch (e) {
            console.log(e);
        }
    };
    UserInterface.prototype._populateSelStations = function () {
        var data = App_1.App.getInstance().getRadioData();
        if (data) {
            for (var _i = 0, _a = data.stations; _i < _a.length; _i++) {
                var station = _a[_i];
                var element = document.createElement('option');
                element.value = station.id;
                element.text = station.name;
                this._selStations.appendChild(element);
            }
        }
    };
    UserInterface.prototype._populateStationOptions = function () {
        var div = _$('#opt-stations').single;
        var stations = App_1.App.getInstance().getRadioData().stations;
        for (var _i = 0, stations_1 = stations; _i < stations_1.length; _i++) {
            var s = stations_1[_i];
            var label = document.createElement('label');
            label.htmlFor = 'opt-station-' + s.id;
            label.className = 'form-radio';
            var option = document.createElement('input');
            option.id = label.htmlFor;
            option.type = 'radio';
            option.name = 'opt-station';
            option.value = s.id;
            option.addEventListener('change', this._onDataSelectionChange.bind(this));
            label.appendChild(option);
            var i = document.createElement('i');
            i.className = 'form-icon';
            label.appendChild(i);
            var text = document.createTextNode(s.name);
            label.appendChild(text);
            div.appendChild(label);
        }
    };
    UserInterface.prototype._setupEventListeners = function () {
        this._chkAllStations.addEventListener('change', this._onChkAllStationsChange.bind(this));
        this._btnSearchSubmit.addEventListener('click', this._onBtnSearchSubmitClick.bind(this));
        this._btnSearchClear.addEventListener('click', this._onBtnSearchClearClick.bind(this));
        this._opt100MostPlayedArtists.addEventListener('change', this._onDataSelectionChange.bind(this));
        this._opt100MostPlayedSongs.addEventListener('change', this._onDataSelectionChange.bind(this));
        this._opt100MostPlayedChristmas.addEventListener('change', this._onDataSelectionChange.bind(this));
    };
    UserInterface.prototype._enableControls = function (enabled) {
        var disabled = !enabled;
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
    };
    UserInterface.prototype._selectAllStations = function (selected) {
        for (var i = 0; i < this._selStations.options.length; ++i) {
            this._selStations.options[i].selected = selected;
        }
    };
    UserInterface.prototype._getSelectedStations = function () {
        var selected = [];
        for (var i = 0; i < this._selStations.options.length; ++i) {
            if (this._selStations.options[i].selected) {
                selected.push(parseInt(this._selStations.options[i].value, 10));
            }
        }
        return selected;
    };
    UserInterface.prototype._onChkAllStationsChange = function () {
        this._selectAllStations(this._chkAllStations.checked);
    };
    UserInterface.prototype._onBtnSearchSubmitClick = function () {
        this._performSearch();
    };
    UserInterface.prototype._onBtnSearchClearClick = function () {
        this._selectAllStations(false);
        this._txtArtist.value = '';
        this._txtSongTitle.value = '';
        this._dateStart.value = '';
        this._dateEnd.value = '';
        this._chkAllStations.checked = false;
        this._selLimit.selectedIndex = 0;
    };
    UserInterface.prototype._onDataSelectionChange = function () {
        var station_id = document.forms[0].elements.namedItem('opt-station').value;
        var data_selection = document.forms[0].elements.namedItem('opt-data-selection').value;
        if (station_id !== '' && data_selection !== '') {
            var station_id_int = parseInt(station_id, 10);
            var data = null;
            var headers = [];
            var fields = [];
            switch (data_selection) {
                case '100_mp_songs':
                    data = PlaylistModel_1.PlaylistModel.getInstance().getMostPlayedSongs(station_id_int, 100);
                    headers = ['Count', 'Artist', 'Song Title'];
                    fields = ['play_count', 'artist_name', 'song_title'];
                    break;
                case '100_mp_artists':
                    data = PlaylistModel_1.PlaylistModel.getInstance().getMostPlayedArtists(station_id_int, 100);
                    headers = ['Count', 'Artist'];
                    fields = ['play_count', 'artist_name'];
                    break;
                case '100_mp_christmas':
                    data = PlaylistModel_1.PlaylistModel.getInstance().getMostPlayedChristmasSongs(station_id_int, 100);
                    headers = ['Count', 'Artist', 'Song Title'];
                    fields = ['play_count', 'artist_name', 'song_title'];
                    break;
            }
            if (data !== null) {
                var table = document.getElementById('data-table');
                if (table) {
                    table.parentElement.removeChild(table);
                }
                table = this._createTable('data-table', headers, fields, data);
                _$('#data-table-container').single.appendChild(table);
            }
        }
    };
    UserInterface.prototype._performSearch = function (reset_page_num) {
        if (reset_page_num === void 0) { reset_page_num = true; }
        if (reset_page_num)
            this._pageNumber = 0;
        var station_ids = this._getSelectedStations();
        var artist_name = '%' + this._txtArtist.value + '%';
        var song_title = '%' + this._txtSongTitle.value + '%';
        var start_date = this._dateStart.valueAsNumber;
        if (isNaN(start_date))
            start_date = 0;
        else
            start_date = start_date / 1000;
        var end_date = this._dateEnd.valueAsNumber;
        if (isNaN(end_date))
            end_date = Math.floor((new Date()).getTime() / 1000);
        else
            end_date = end_date / 1000;
        var limit = parseInt(this._selLimit.value, 10) || 25;
        var offset = this._pageNumber * limit;
        var total_records = PlaylistModel_1.PlaylistModel.getInstance().searchTotal(station_ids, artist_name, song_title, start_date, end_date);
        var records = PlaylistModel_1.PlaylistModel.getInstance().search(station_ids, artist_name, song_title, start_date, end_date, limit, offset);
        for (var i = 0; i < records.length; ++i) {
            records[i].timestamp = (new Date(records[i].timestamp * 1000)).toUTCString();
        }
        _$('#results').single.textContent = total_records + " results";
        var total_pages = Math.ceil(total_records / limit);
        this._lastPageNumber = (total_pages > 0) ? total_pages - 1 : 0;
        var table = document.getElementById('playlists-table');
        if (table)
            table.parentElement.removeChild(table);
        table = this._createTable('playlists-table', ['Station', 'Artist', 'Song Title', 'Time'], ['station_name', 'artist_name', 'song_title', 'timestamp'], records);
        _$('#playlist-table-container').single.appendChild(table);
        this._generatePaginationTable(total_pages);
    };
    UserInterface.prototype._generatePaginationTable = function (total_pages) {
        this._playlistsPagination.classList.remove('hidden');
        var elements = Array.prototype.slice.call(this._playlistsPagination.children);
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var e = elements_1[_i];
            if (e !== this._playlistsPaginationPrev && e !== this._playlistsPaginationNext) {
                this._playlistsPagination.removeChild(e);
            }
        }
        for (var i = 0; i < total_pages; ++i) {
            var e = document.createElement('li');
            e.classList.add('page-item');
            if (i === this._pageNumber)
                e.classList.add('active');
            var a = document.createElement('a');
            var num_str = (i + 1).toString();
            a.href = '#';
            a.onclick = function () { return false; };
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
    };
    UserInterface.prototype._onPaginationLinkClick = function (e) {
        var page = parseInt(e.target.dataset.page, 10) || 0;
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
                this._pageNumber = this._lastPageNumber;
            }
            else {
                this._pageNumber = page - 1;
            }
        }
        this._performSearch(false);
    };
    UserInterface.prototype._createTable = function (id, headers, fields, data) {
        var table = document.createElement('table');
        table.id = id;
        table.classList.add('table', 'table-striped', 'table-hover');
        var thead = document.createElement('thead');
        var tr = document.createElement('tr');
        for (var _i = 0, headers_1 = headers; _i < headers_1.length; _i++) {
            var label = headers_1[_i];
            var th = document.createElement('th');
            th.textContent = label;
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        table.appendChild(thead);
        var tbody = document.createElement('tbody');
        for (var _a = 0, data_1 = data; _a < data_1.length; _a++) {
            var row = data_1[_a];
            tr = document.createElement('tr');
            for (var _b = 0, fields_1 = fields; _b < fields_1.length; _b++) {
                var f = fields_1[_b];
                var td = document.createElement('td');
                td.textContent = row[f];
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        return table;
    };
    return UserInterface;
}());
exports.UserInterface = UserInterface;

},{"./App":1,"./Exceptions":2,"./PlaylistModel":3}]},{},[1]);
