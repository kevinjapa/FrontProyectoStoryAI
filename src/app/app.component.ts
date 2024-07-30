import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './service/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // DireccionIP: string = "http://127.0.0.1:5001";
  DireccionIP: string = "http://127.0.0.1:5000";
  messageToSend: string = '';
  responseMessage: string = '';
  errorMessage: string = '';
  apiUrl = this.DireccionIP+'/api/chat-gpt';
  imageApiUrl = this.DireccionIP+'/generate-image';
  getChatHistoryApiUrl = this.DireccionIP+'/api/get-chat-history';

  title = 'FrontProyectoStoryAI';
  transcript: string = '';
  isRecording = false;
  isLoading = false;
  mediaRecorder: MediaRecorder | null = null;
  audioStream: MediaStream | null = null;
  chatHistory: { question: string, answer: string, imageUrl?: string }[] = [];
  textAudio: string = ''; // Variable con el texto del AUDIO

  // Para el Boton de los personajes
  dropdownOpen = false;
  colors = ['Barney', 'Homero Simpson', 'Pepa Pig', 'Riley'];
  selectedColor: string | null = null;

  // Variables para la generación de imágenes
  imagePrompt: string = '';
  generatedImageUrl: string | null = null;

  // variables para el ususario: isAuthenticated = false;
  isAuthenticated = false;
  userId: number | null = null;
  showLogin = true;  // Variable para alternar entre login y registro


  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    // this.loadChatHistory(); // Cargar el historial del chat al inicializar el componente
    const savedUserId = localStorage.getItem('user_id');
    if (savedUserId) {
      this.userId = parseInt(savedUserId, 10);
      this.isAuthenticated = true;
      this.loadChatHistory();
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectColor(color: string) {
    this.selectedColor = color;
    console.log(`The selected color is ${color}`);
    this.dropdownOpen = false;
  }

  handleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.audioStream = stream;
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        this.mediaRecorder.start();
        this.isRecording = true;

        const audioChunks: BlobPart[] = [];
        this.mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        this.mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);

          this.isLoading = true;
          fetch(this.DireccionIP + '/api/transcribe', {
            method: 'POST',
            body: formData
          }).then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          }).then(data => {
            this.transcript = data.transcript;
            this.textAudio = this.transcript;
            this.transcript = '';
            this.isLoading = false;
            this.sendMessage(this.textAudio);
          }).catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            this.isLoading = false;
          }).finally(() => {
            if (this.audioStream) {
              this.audioStream.getTracks().forEach(track => track.stop());
            }
            this.isRecording = false;
          });
        });
      }).catch(error => {
        console.error('There was a problem with getUserMedia:', error);
        this.isRecording = false;
      });
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  sendMessage(txtAudio: string) {
    this.messageToSend = txtAudio;
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
          this.responseMessage = response.response; 
          this.chatHistory.push({ question: this.messageToSend, answer: this.responseMessage });
          this.messageToSend = ''; 
          this.isLoading = false;
          this.generateImage(this.responseMessage);
          this.saveChatHistory();
        },
        (error: any) => {
          console.error('API Error:', error);
          this.errorMessage = 'Error al enviar el mensaje.';
          this.isLoading = false;
        }
      );
  }

  generateImage(prompt: string) {
    this.imagePrompt = prompt;
    if (!this.imagePrompt) {
      alert('Por favor, ingrese una descripción para la imagen.');
      return;
    }
  
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const payload = {
      prompt: this.imagePrompt
    };
  
    this.http.post<any>(this.imageApiUrl, payload, { headers: headers })
      .subscribe(
        (response: any) => {
          console.log('Image API Response:', response);
          this.generatedImageUrl = response.image_url;
          if (this.generatedImageUrl) {
            this.addImageToChatHistory(this.generatedImageUrl);
            this.saveChatHistory();
          } else {
            console.error('Image URL is null');
          }
        },
        (error: any) => {
          console.error('Image API Error:', error);
          this.errorMessage = 'Error al generar la imagen.';
        }
      );
  }

  addImageToChatHistory(imageUrl: string) {
    const lastChatEntry = this.chatHistory[this.chatHistory.length - 1];
    if (lastChatEntry) {
      lastChatEntry.imageUrl = imageUrl;
    }
  }

  saveChatHistory() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const payload = {
      user_id: this.userId,
      chatHistory: this.chatHistory
    };

    this.http.post<any>(this.DireccionIP+'/api/save-chat-history', payload, { headers: headers })
      .subscribe(
        response => {
          console.log('Chat history saved:', response);
        },
        error => {
          console.error('Error saving chat history:', error);
        }
      );
  }

  loadChatHistory() {
    this.http.get<any>(this.DireccionIP+`/api/get-chat-history?user_id=${this.userId}`)
      .subscribe(
        response => {
          console.log('Chat history loaded:', response);
          this.chatHistory = response.chatHistory;
        },
        error => {
          console.error('Error loading chat history:', error);
        }
      );
  }

  // Control de Usuarios
  
  // register(username: string, password: string, confirmPassword: string) {

  //   if(password===confirmPassword){
  //     this.authService.register(username, password).subscribe(
  //       response => {
  //         console.log('User registered:', response);
  //         alert("Usuario Registrado Correctamente");
  //         this.toggleAuthForm();
  //       },
  //       error => {
  //         console.error('Error al Registrar:', error);
  //         alert("Error al Registrar:");
  //       }
  //     );
  //   }
  //   else{
  //     alert("Error al Registrar");
  //   }
  // }

  isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
  register(username: string, password: string, confirmPassword: string) {
    if (!this.isValidEmail(username)) {
      alert("Por favor, ingrese un correo electrónico válido.");
      return;
    }
    if (password === confirmPassword) {
      this.authService.register(username, password).subscribe(
        response => {
          console.log('User registered:', response);
          alert("Usuario Registrado Correctamente");
          this.toggleAuthForm();
        },
        error => {
          console.error('Error al Registrar:', error);
          alert("Error al Registrar:");
        }
      );
    } else {
      alert("Las contraseñas no coinciden.");
    }
  }
  login(username: string, password: string) {
    // if (!this.isValidEmail(username)) {
    //   alert("Por favor, ingrese un correo electrónico válido.");
    //   return;
    // }
    this.authService.login(username, password).subscribe(
      response => {
        console.log('Login successful:', response);
        this.userId = response.user_id;
  
        if (this.userId != null) {
          localStorage.setItem('user_id', this.userId.toString());
          this.isAuthenticated = true;
          this.loadChatHistory();
        } else {
          console.error('user_id is null or undefined');
        }
      },
      error => {
        console.error('Login error:', error);
        alert("Usuario o Contraseña son Incorrectos");
      }
    );
  }
  logout() {
    this.isAuthenticated = false;
    this.userId = null;
    localStorage.removeItem('user_id');
  }
  toggleAuthForm() {
    this.showLogin = !this.showLogin;
  }
}
