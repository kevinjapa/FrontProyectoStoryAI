import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'FrontProyectoStoryAI';
  
  transcript: string = '';
  isRecording = false;
  isLoading = false;

  handleRecording() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.startRecording();
      
      setTimeout(() => {
        this.isRecording = false;
      }, 5000); // Cambia el estado después de 5 segundos
    }
  }

  // startRecording() {
  //   navigator.mediaDevices.getUserMedia({ audio: true })
  //     .then(stream => {
  //       const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  //       mediaRecorder.start();

  //       const audioChunks: BlobPart[] = [];
  //       mediaRecorder.addEventListener("dataavailable", event => {
  //         audioChunks.push(event.data);
  //       });

  //       mediaRecorder.addEventListener("stop", () => {
  //         const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  //         const formData = new FormData();
  //         formData.append('audio', audioBlob);

  //         fetch('http://127.0.0.1:5000/api/transcribe', {
  //           method: 'POST',
  //           body: formData
  //         }).then(response => {
  //           if (!response.ok) {
  //             throw new Error('Network response was not ok');
  //           }
  //           return response.json();
  //         }).then(data => {
  //           this.transcript = data.transcript;
  //         }).catch(error => {
  //           console.error('There was a problem with the fetch operation:', error);
  //         });
  //       });

  //       setTimeout(() => {
  //         mediaRecorder.stop();
  //       }, 5000); // Graba por 5 segundos
  //     }).catch(error => {
  //       console.error('There was a problem with getUserMedia:', error);
  //     });
  // }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.start();

        const audioChunks: BlobPart[] = [];
        mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);

          this.isLoading = true; // Inicia el estado de carga
          fetch('http://127.0.0.1:5000/api/transcribe', {
            method: 'POST',
            body: formData
          }).then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          }).then(data => {
            this.transcript = data.transcript;
            this.isLoading = false; // Termina el estado de carga
          }).catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            this.isLoading = false; // Termina el estado de carga en caso de error
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
