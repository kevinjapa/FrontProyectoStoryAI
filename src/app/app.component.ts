import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  textAudio: string = ''; // Variable con el texto del AUDIO


  // Para el Boton de los personajes 

  dropdownOpen = false;
  colors = ['Barney', 'Homero Simpson', 'Pepa Pig', 'Riley' ];
  selectedColor: string | null = null;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectColor(color: string) {
    this.selectedColor = color;
    console.log(`The selected color is ${color}`);
    this.dropdownOpen = false; // Close dropdown after selection
  }

  title = 'FrontProyectoStoryAI';
  transcript: string = '';
  isRecording = false;
  isLoading = false;
  mediaRecorder: MediaRecorder | null = null;
  audioStream: MediaStream | null = null;
  chatHistory: { question: string, answer: string }[] = []; // Lista para almacenar el historial de chat

  handleRecording() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.startRecording();
      
      setTimeout(() => {
        this.isRecording = false;
        if (this.mediaRecorder) {
          this.mediaRecorder.stop();
        }
      }, 7000); 
    }
  }

  // para grabar el audio y generar texto 

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.audioStream = stream;
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        this.mediaRecorder.start();

        const audioChunks: BlobPart[] = [];
        this.mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        this.mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);

          this.isLoading = true; 
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
            this.textAudio=this.transcript;
            this.chatHistory.push({ question: this.transcript, answer: '' }); 
            this.transcript = ''; 
            this.isLoading = false; 
            this.sendMessage();
          }).catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            this.isLoading = false; 
          }).finally(() => {
            if (this.audioStream) {
              this.audioStream.getTracks().forEach(track => track.stop());
            }
          });
        });

        setTimeout(() => {
          this.mediaRecorder?.stop();
        }, 7000);
      }).catch(error => {
        console.error('There was a problem with getUserMedia:', error);
        this.isRecording = false; 
      });
  }


  // modelo para el texto:
  // messageToSend: string = '';
  // responseMessage: any;
  // errorMessage: string = '';
  // apiUrl = 'http://127.0.0.1:5000/api/chat-gpt';

  // constructor(private http: HttpClient) {}

  // sendMessage() {
  //   this.isLoading = true;
  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/json'
  //   });
  //   const payload = {
  //     message: this.messageToSend
  //   };

  //   this.http.post<any>(this.apiUrl, payload, { headers: headers })
  //     .subscribe(
  //       (response: any) => {
  //         console.log('API Response:', response);
  //         this.responseMessage = response;
  //         this.chatHistory.push({ question: this.responseMessage, answer: '' });
  //         // Aquí puedes manejar la respuesta como desees
  //         this.isLoading = false; // Finaliza el estado de carga
  //       },
  //       (error: any) => {
  //         console.error('API Error:', error);
  //         this.errorMessage = 'Error al enviar el mensaje.';
  //         this.isLoading = false; // Finaliza el estado de carga en caso de error
  //       }
  //     );
  // }

  // Para el modelo generativo de Cuento 

  messageToSend: string = this.textAudio;
  responseMessage: string = '';
  errorMessage: string = '';
  apiUrl = 'http://127.0.0.1:5000/api/chat-gpt';

  constructor(private http: HttpClient) {}

  sendMessage() {
    this.isLoading = true;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const payload = {
      message: this.messageToSend
    };

    this.http.post<any>(this.apiUrl, payload, { headers: headers })
      .subscribe(
        (response: any) => {
          console.log('API Response:', response);
          this.responseMessage = response.response; // Accede al contenido real de la respuesta
          this.chatHistory.push({ question: this.messageToSend, answer: this.responseMessage });
          this.isLoading = false;
        },
        (error: any) => {
          console.error('API Error:', error);
          this.errorMessage = 'Error al enviar el mensaje.';
          this.isLoading = false;
        }
      );
  }

}
