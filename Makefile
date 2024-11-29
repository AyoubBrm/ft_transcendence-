containers = $(shell docker ps -aq)
images = $(shell docker images -q)
volume = $(shell docker volume ls -q)
network = $(shell docker network ls -q)
GREEN = "\033[0;32m"
NC = "\033[0m"
BLUE = "\033[0;34m"
BLACK = "\033[0;30m"
RED = "\033[0;31m"

all:
	@docker compose -f ./docker-compose.yml up --build -d
	@clear
	@ ${welcome}
	@sleep 1
	@${to}
	@sleep 1
	@ ${transcendance}

build:
	@docker compose -f ./docker-compose.yml build

show:
	@docker compose -f ./docker-compose.yml up --build

clean:
	@if [ -n "$(containers)" ]; then docker rm -f $(containers); fi

fclean: clean
	@if [ -n "$(images)" ]; then docker rmi -f $(images); fi
	@if [ -n "$(volume)" ]; then docker volume rm -f $(volume); fi
	@if [ -n "$(network)" ]; then docker network prune -f; fi
	@docker system prune -af
	@echo ${RED}"All containers, images, volumes and networks have been removed."${NC}
	@find . -type d -name "__pycache__" -exec rm -r {} +
	@echo ${RED}"All __pycache__ folders have been removed."${NC}
	@find . -type d -name "migrations" -exec rm -r {} +
	@echo ${RED}"All migrations folders have been removed."${NC}

stop:
	@docker compose -f ./docker-compose.yml stop

down:
	@docker compose -f ./docker-compose.yml down

logs:
	@docker compose -f ./docker-compose.yml logs -f

re: clean all

reshow: clean show

sre: fclean all


define welcome
	@echo ${GREEN} "			██     ██ ███████ ██       ██████  ██████  ███    ███ ███████ " ${NC}
	@echo ${GREEN} "			██     ██ ██      ██      ██      ██    ██ ████  ████ ██      " ${NC}
	@echo ${GREEN} "			██  █  ██ █████   ██      ██      ██    ██ ██ ████ ██ █████   " ${NC}
	@echo ${GREEN} "			██ ███ ██ ██      ██      ██      ██    ██ ██  ██  ██ ██      " ${NC}
	@echo ${GREEN} "			 ███ ███  ███████ ███████  ██████  ██████  ██      ██ ███████ " ${NC}
	@echo 
    
endef	
                                                              

define to
	@ echo ${GREEN} "						████████  ██████ " ${NC}
	@ echo ${GREEN} "						   ██    ██    ██" ${NC}
	@ echo ${GREEN} "						   ██    ██    ██" ${NC}
	@ echo ${GREEN} "						   ██    ██    ██" ${NC}
	@ echo ${GREEN} "						   ██     ██████ " ${NC}
	@echo
endef


define transcendance
	
	@echo ${GREEN} "████████ ██████   █████  ███    ██ ███████  ██████ ███████ ███    ██ ██████  ███████ ███    ██  ██████ ███████ " ${NC}
	@echo ${GREEN} "   ██    ██   ██ ██   ██ ████   ██ ██      ██      ██      ████   ██ ██   ██ ██      ████   ██ ██      ██      " ${NC}
	@echo ${GREEN} "   ██    ██████  ███████ ██ ██  ██ ███████ ██      █████   ██ ██  ██ ██   ██ █████   ██ ██  ██ ██      █████   " ${NC}
	@echo ${GREEN} "   ██    ██   ██ ██   ██ ██  ██ ██      ██ ██      ██      ██  ██ ██ ██   ██ ██      ██  ██ ██ ██      ██      " ${NC}
	@echo ${GREEN} "   ██    ██   ██ ██   ██ ██   ████ ███████  ██████ ███████ ██   ████ ██████  ███████ ██   ████  ██████ ███████ " ${NC}
	@echo
                                                                  

endef
