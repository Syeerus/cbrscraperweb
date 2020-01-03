/**
 * @file PlaylistModel.ts
 * @description Handles database queries for the playlists table
 * @author Syeerus
 * @license MIT
 */

import { App } from "./App";

export class PlaylistModel {
    private static _instance: PlaylistModel;
    private _prevSql: string;
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
    public searchTotal(station_ids: Array<number>, artist_name: string, song_title: string, start_date: number, end_date: number): number {
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
                    "AND songs.title LIKE ? " +
                    "AND playlists.timestamp >= ? " +
                    "AND playlists.timestamp <= ?";
        let data = App.getInstance().getRadioData();
        let params = [data.playlists, data.songs, data.artists, data.stations].concat(station_ids).concat([artist_name, song_title, start_date, end_date]);
        let results = this._exec(sql, params);
        return results[0].total_records;
    }

    /**
     * @description Performs a search query and returns the records found.
     */
    public search(station_ids: Array<number>, artist_name: string, song_title: string, start_date: number, end_date: number, limit: number, offset: number): Array<any> {
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
        "AND playlists.timestamp >= ? " +
        "AND playlists.timestamp <= ? " +
        "ORDER BY playlists.timestamp " +
        "LIMIT " + limit + " OFFSET " + offset;
        let data = App.getInstance().getRadioData();
        let params = [data.playlists, data.songs, data.artists, data.stations].concat(station_ids).concat([artist_name, song_title, start_date, end_date]);
        return this._exec(sql, params);
    }

    /**
     * @description Returns the most played songs on a station.
     */
    public getMostPlayedSongs(station_id: number, limit: number): Array<any> {
        let sql = "SELECT COUNT(*) AS play_count, FIRST(artists.name) AS artist_name, FIRST(songs.title) AS song_title FROM ? AS playlists " +
        "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
        "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
        "WHERE playlists.station_id = ? " +
        "GROUP BY playlists.song_id " +
        "ORDER BY play_count DESC " +
        "LIMIT " + limit;
        let data = App.getInstance().getRadioData();
        let params = [data.playlists, data.songs, data.artists, station_id];
        return this._exec(sql, params);
    }

    /**
     * @description Returns the most played artists on a station.
     */
    public getMostPlayedArtists(station_id: number, limit: number): Array<any> {
        let sql = "SELECT COUNT(*) AS play_count, FIRST(artists.name) AS artist_name FROM ? AS playlists " +
        "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
        "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
        "WHERE playlists.station_id = ? " +
        "GROUP BY songs.artist_id " +
        "ORDER BY play_count DESC " +
        "LIMIT " + limit;
        let data = App.getInstance().getRadioData();
        let params = [data.playlists, data.songs, data.artists, station_id];
        return this._exec(sql, params);
    }

    /**
     * @description Returns the most played songs with christmas keywords in the song title.
     */
    public getMostPlayedChristmasSongs(station_id: number, limit: number): Array<any> {
        let sql = "SELECT COUNT(*) AS play_count, FIRST(artists.name) AS artist_name, FIRST(songs.title) AS song_title FROM ? AS playlists " +
        "INNER JOIN ? AS songs ON playlists.song_id = songs.id " +
        "INNER JOIN ? AS artists ON songs.artist_id = artists.id " +
        "WHERE playlists.station_id = ? " +
        "AND (";
        let keywords = [
            "christmas", "jingle", "bells", "reindeer", "santa", "baby it's cold", "snow", "feliz navidad",
            "grandma got run over", "little drummer", "mary", "december"
        ];
        for (let i=0; i<keywords.length; ++i) {
            keywords[i] = '%' + keywords[i] + '%';

            sql += "songs.title LIKE ? ";
            if (i < keywords.length - 1) {
                sql += "OR ";
            }
        }
        sql += ") GROUP BY playlists.song_id " +
        "ORDER BY play_count DESC " +
        "LIMIT " + limit;
        let data = App.getInstance().getRadioData();
        let params = [data.playlists, data.songs, data.artists, station_id].concat(keywords);
        return this._exec(sql, params);
    }

    /**
     * @description Creates and executes a prepared statement.
     */
    private _exec(sql: string, parameters: Array<any>): any {
        if (sql === this._prevSql && this._prevStmt) {
            return this._prevStmt(parameters);
        }

        this._prevSql = sql;
        this._prevStmt = window.alasql.compile(sql);
        return this._prevStmt(parameters);
    }
}
