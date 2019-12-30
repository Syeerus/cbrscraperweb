/**
 * @file App.ts
 * @description Main application.
 * @author Syeerus
 * @license MIT
 */


class App {
    public static readonly DATA_FILE = 'cbrs.db.json.bz2';
    public static readonly MAX_DATA_TRANSFER_ATTEMPTS = 3;

    private _radioData: any = null;
    private _dataTransferAttempts: number = 0;

    /**
     * @description Returns the radio data.
     * @returns {object}
     */
    public getRadioData(): any {
        return this._radioData;
    }

    /**
     * @description Executed when the page loads.
     */
    public init() {
        this._startDataFileTransfer();
    }

    /**
     * @description Starts the transfer of the data file.
     */
    private _startDataFileTransfer() {
        ++this._dataTransferAttempts;
        console.log("Data file download attempt #" + this._dataTransferAttempts);

        let xhr = new XMLHttpRequest();
        let on_data_file_transfer_failure = this._onDataFileTransferFailure.bind(this, xhr);
        xhr.addEventListener('load', this._onDataFileLoaded.bind(this, xhr));
        xhr.addEventListener('error', on_data_file_transfer_failure);
        xhr.addEventListener('abort', on_data_file_transfer_failure);
        xhr.open('GET', App.DATA_FILE);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }

    /**
     * @description Event handler for when the data file transfer is complete.
     */
    private _onDataFileLoaded(xhr: XMLHttpRequest) {
        if (xhr.status === 200) {
            let data = new Uint8Array(xhr.response);
            try {
                let decompressed_data = window.bz2.decompress(data, true);
                let decoder = new TextDecoder();
                this._radioData = JSON.parse(decoder.decode(decompressed_data));
            }
            catch (e) {
                console.log(e);
            }
        }
        else {
            console.log('Error downloading data file: ' + xhr.statusText);
        }
    }

    /**
     * @description Event handler for when the file transfer for the data file fails.
     */
    private _onDataFileTransferFailure(xhr: XMLHttpRequest) {
        console.log('An error occured while transferring the file.');
        console.log('Status: ', xhr.statusText);

        if (this._dataTransferAttempts < App.MAX_DATA_TRANSFER_ATTEMPTS) {
            this._startDataFileTransfer();
        }
    }
}

(function() {
    var app = new App();
    app.init();
}());
