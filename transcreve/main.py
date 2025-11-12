from app import record_audio, transcribe_audio, check_trigger_phrase
import os
import subprocess

def main():
    temp_dir = 'temp'
    audio_file = os.path.join(temp_dir, "microfone_audio.wav")
    # Garante que a pasta temp existe
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    # Depuração: mostra o caminho do arquivo de áudio
    print(f"Arquivo de áudio será salvo em: {audio_file}")

    # Dicionário de frases acionadoras e scripts correspondentes
    # Adicione quantas frases/scripts quiser
    trigger_scripts = {
        # APP TAREFAS
        "executar a tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        "executar tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        "iniciar tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        "iniciar a tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        "rodar tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        "abra tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        "abra  as tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        "tarefas": "C:\\Users\\jpger\\py_scripts\\apps\\tarefas\\start_server.bat",
        # NAVEGADOR WEB BRAVE
        "web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "executar a web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "executar web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "iniciar web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "iniciar a web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "rodar web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "abra web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "abra  o web": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        # INICIA MUSICA
        "iniciar musica": "C:\\Users\\jpger\\Music\\Pink Floyd - Welcome To The Machine.mp3",
        "musica": "C:\\Users\\jpger\\Music\\Pink Floyd - Welcome To The Machine.mp3",
        "tocar musica": "C:\\Users\\jpger\\Music\\Pink Floyd - Welcome To The Machine.mp3",
        "iniciar música": "C:\\Users\\jpger\\Music\\Pink Floyd - Welcome To The Machine.mp3",
        "música": "C:\\Users\\jpger\\Music\\Pink Floyd - Welcome To The Machine.mp3",
        "tocar música": "C:\\Users\\jpger\\Music\\Pink Floyd - Welcome To The Machine.mp3"

    }
    trigger_phrases = list(trigger_scripts.keys())

    # Grava o áudio
    recorded_file = record_audio(filename=audio_file)

    # Transcreve o áudio
    transcribed_text = transcribe_audio(recorded_file)

    # Verifica se a frase específica está na transcrição
    is_triggered, detected_phrase = check_trigger_phrase(transcribed_text, trigger_phrases)

    
    if is_triggered and detected_phrase in trigger_scripts:
        script_para_executar = trigger_scripts[detected_phrase]
        print(f"Frase '{detected_phrase}' detectada! Executando script '{script_para_executar}'...")
        if os.path.exists(script_para_executar):
            try:
                if script_para_executar.endswith('.bat'):
                    subprocess.Popen(f'start "" "{script_para_executar}"', shell=True)
                elif script_para_executar.endswith('.py'):
                    subprocess.run(["python", script_para_executar], check=True)
                elif script_para_executar.endswith('.exe'):
                    subprocess.Popen([script_para_executar], shell=True)
                elif script_para_executar.endswith('.mp3') or script_para_executar.endswith('.mp4'):
                    subprocess.Popen([script_para_executar], shell=True)
                else:
                    print(f"Tipo de arquivo não suportado: {script_para_executar}")
            except subprocess.CalledProcessError as e:
                print(f"Erro ao executar o script '{script_para_executar}': {e}")
            except FileNotFoundError:
                print(f"Interpretador Python não encontrado. Verifique sua instalação.")
        else:
            print(f"Script '{script_para_executar}' não encontrado.")
    else:
        print(f"Nenhuma das frases acionadoras foi detectada na transcrição.")
if __name__ == "__main__":
    main()
