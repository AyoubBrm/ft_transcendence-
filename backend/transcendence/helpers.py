import socket
import time
import os


def expand_from_env(file_path: str, var_to_get: str) -> str:
    env_vars: dict = {}
    check: str = ""
    try:
        with open(file_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(f"Error: The file {file_path} does not exist.")
    try:
        check = env_vars.get(var_to_get)
    except Exception as e:
        print(f"{e}")
    return check


def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
    print(f"Local IP : {local_ip}")
    return local_ip

def wait_for_postgres():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    while True:
        try:
            print("Waiting for postgres...")
            s.connect((os.getenv('POSTGRES_HOST'), 5432))
            s.close()
            break
        except socket.error as ex:
            time.sleep(5)

if __name__ == '__main__':
    wait_for_postgres()