import { EventEmitter, Injectable } from '@angular/core';
import { AssemblyAI } from 'assemblyai';

@Injectable({
  providedIn: 'root'
})
export class AudioEntradaService {
  public transcriptEmitter = new EventEmitter<string>();

  private client: AssemblyAI;

  constructor() {
    this.client = new AssemblyAI({
      apiKey: "ce840f91f6634948b587ead0702b25c4"
    });
  }

  // reconcimiento del texto version del pedro
  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.start();

        const audioChunks: BlobPart[] | undefined = [];
        mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);

          fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          }).then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          }).then(data => {
            this.transcriptEmitter.emit(data.transcript);
          }).catch(error => {
            console.error('There was a problem with the fetch operation:', error);
          });
        });

        setTimeout(() => {
          mediaRecorder.stop();
        }, 5000); // Graba por 5 segundos
      }).catch(error => {
        console.error('There was a problem with getUserMedia:', error);
      });
  }
}

