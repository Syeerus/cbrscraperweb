#!/usr/bin/env python3
# File: dbdump.py
# Author: Syeerus
# License: MIT


import argparse
import sqlite3
import json
import bz2


VERSION = '1.0.0'


def get_args():
    """
    Parses arguments from the command line.
    :return: Parsed arguments.
    """
    parser = argparse.ArgumentParser(description='Dumps a cbrscraper database to a JSON file.')
    parser.add_argument('filename', help='Filename of the database to use.')
    parser.add_argument('-c', '--compress', help='Compresses the output file using bz2.', action='store_true')
    parser.add_argument('-v', '--version', help='Displays version info.', action='version', version='v{0}'.format(VERSION))
    return parser.parse_args()


def get_stations_table(cursor: sqlite3.Cursor, data: dict):
    """
    Gets the data from the stations table.
    :param cursor: SQLite3 cursor.
    :param data: Data dictionary.
    """
    print('Getting stations table.')
    data['stations'] = []
    query = cursor.execute('SELECT * FROM stations')
    rows = query.fetchall()
    for r in rows:
        data['stations'].append({
            'id': r['id'],
            'name': r['name']
        })


def get_artists_table(cursor: sqlite3.Cursor, data: dict):
    """
    Gets the data from the artists table.
    :param cursor: SQLite3 cursor.
    :param data: Data dictionary.
    """
    print('Getting artists table.')
    data['artists'] = []
    query = cursor.execute('SELECT * FROM artists')
    rows = query.fetchall()
    for r in rows:
        data['artists'].append({
            'id': r['id'],
            'name': r['name']
        })


def get_songs_table(cursor: sqlite3.Cursor, data: dict):
    """
    Gets the data from the songs table.
    :param cursor: SQLite3 cursor.
    :param data: Data dictionary.
    """
    print('Getting songs table.')
    data['songs'] = []
    query = cursor.execute('SELECT * FROM songs')
    rows = query.fetchall()
    for r in rows:
        data['songs'].append({
            'id': r['id'],
            'artist_id': r['artist_id'],
            'title': r['title']
        })


def get_playlists_table(cursor: sqlite3.Cursor, data: dict):
    """
    Gets the data from the playlists table.
    :param cursor: SQLite3 cursor.
    :param data: Data dictionary.
    """
    print('Getting playlists table.')
    data['playlists'] = []
    query = cursor.execute('SELECT * FROM playlists')
    rows = query.fetchall()
    for r in rows:
        data['playlists'].append({
            'station_id': r['station_id'],
            'song_id': r['song_id'],
            'timestamp': r['timestamp']
        })


def output_file(filename: str, compress: bool, data: dict):
    """
    Outputs the JSON file.
    :param filename: Filename.
    :param compress: If the file should be compressed.
    :param data: Data dictionary.
    """
    print('Outputting file.')
    data = json.dumps(data, separators=(',', ':'))
    if compress:
        with open(filename + '.json.bz2', 'wb') as fp:
            data_bytes = bytes(data, encoding='utf-8')
            fp.write(bz2.compress(data_bytes))
    else:
        with open(filename + '.json', 'w') as fp:
            fp.write(data)


def main():
    """Main subroutine"""
    args = get_args()
    data = {}
    try:
        conn = sqlite3.connect(args.filename)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        get_stations_table(c, data)
        get_artists_table(c, data)
        get_songs_table(c, data)
        get_playlists_table(c, data)
        output_file(args.filename, args.compress, data)
    except Exception as e:
        print('Error: {0}'.format(e))


if __name__ == '__main__':
    main()
