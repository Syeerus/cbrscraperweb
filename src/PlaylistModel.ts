/**
 * @file PlaylistModel.ts
 * @description Handles database queries for the playlists table
 * @author Syeerus
 * @license MIT
 */

import { App } from "./App";

export class PlaylistModel {
    private static _instance: PlaylistModel;
    private _prevSQL: string;
    private _prevStmt: Function;       // Compiled statement

    private constructor() {
    }

    /**
     * @description Returns the instance of the playlist model.
     */
    public static getInstance(): PlaylistModel {
        if (!PlaylistModel._instance) {
            PlaylistModel._instance = new PlaylistModel();
        }

        return PlaylistModel._instance;
    }

    /**
     * @description Destroys the instance of the playlist model.
     */
    public static destroyInstance() {
        PlaylistModel._instance = null;
    }

    /**
     * @description Performs a search query and returns the number of records found.
     */
    public searchTotal(station_ids: Array<number>, artist_name: string, song_title: string): number {
        if (station_ids.length <= 0) {
            // Can't perform a search
            return 0;
        }

        let station_placeholders = '';
        for (let i = 0; i<station_ids.length; ++i)
            station_placeholders += '?,';

        let sql = "SELECT COUNT(*) AS total_records FROM ? AS playlists " +
                    "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
                    "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
                    "INNER JOIN ? AS stations ON playlists.station_id = stations.id " +
                    "WHERE playlists.station_id IN (" + station_placeholders.substring(0, station_placeholders.length - 1) + ") " +
                    "AND artists.name LIKE ? " +
                    "AND songs.title LIKE ?";
        let data = App.getInstance().getRadioData();
        let params = [data.playlists, data.songs, data.artists, data.stations].concat(station_ids).concat([artist_name, song_title]);
        let results = this._exec(sql, params);
        return results[0].total_records;
    }

    /**
     * @description Performs a search query and returns the records found.
     */
    public search(station_ids: Array<number>, artist_name: string, song_title: string, limit: number, offset: number): Array<any> {
        if (station_ids.length <= 0) {
            // Can't perform a search
            return [];
        }

        let station_placeholders = '';
        for (let i = 0; i<station_ids.length; ++i)
            station_placeholders += '?,';

        let sql = "SELECT stations.name AS station_name, artists.name AS artist_name, songs.title AS song_title, playlists.timestamp AS timestamp FROM ? AS playlists " +
        "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
        "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
        "INNER JOIN ? AS stations ON playlists.station_id = stations.id " +
        "WHERE playlists.station_id IN (" + station_placeholders.substring(0, station_placeholders.length - 1) + ") " +
        "AND artists.name LIKE ? " +
        "AND songs.title LIKE ? " +
        "ORDER BY playlists.timestamp " +
        "LIMIT " + limit + " OFFSET " + offset;
        let data = App.getInstance().getRadioData();
        let params = [data.playlists, data.songs, data.artists, data.stations].concat(station_ids).concat([artist_name, song_title]);
        return this._exec(sql, params);
    }

        /**
     * @description Creates and executes a prepared statement.
     */
    private _exec(sql: string, parameters: Array<any>): any {
        if (sql === this._prevSQL && this._prevStmt) {
            return this._prevStmt(parameters);
        }

        this._prevSQL = sql;
        this._prevStmt = window.alasql.compile(sql);
        return this._prevStmt(parameters);
    }
}
