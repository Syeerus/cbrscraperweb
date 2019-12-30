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
            let blob_url = window.URL.createObjectURL(new Blob([document.querySelector('#decompress-worker').textContent]));
            let worker = new Worker(blob_url);
            let app = this;
            worker.onmessage = function(e) {
                try {
                    let decoder = new TextDecoder();
                    app._radioData = JSON.parse(decoder.decode(e.data));
                    console.log('Data file successfully parsed.');
                }
                catch (e) {
                    console.log(e);
                }

                window.URL.revokeObjectURL(blob_url);
                worker.terminate();
            };

            worker.onerror = function(e) {
                console.log('An error occured: ', e);
            }

            let url = document.location.href;
            let index = url.indexOf('index.html');
            if (index > -1) {
                url = url.substring(0, index);
            }
            worker.postMessage({data: data, url: url});
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
