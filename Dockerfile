FROM ubuntu:22.04 AS builder

WORKDIR /usr/src/webpty

RUN apt update && apt install -y \
    curl \
    build-essential \
    python3 \
    python3-distutils \
    python3-venv

ENV NVM_DIR=/root/.nvm
RUN mkdir -p $NVM_DIR && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

RUN bash -c ". $NVM_DIR/nvm.sh && nvm install 16.16.0 && nvm install 23.3.0"


COPY frontend frontend
COPY backend backend

RUN bash -c ". $NVM_DIR/nvm.sh && \
    nvm use 23.3.0 && \ 
    cd frontend && \ 
    npm install && \
    npm run build"

RUN bash -c ". $NVM_DIR/nvm.sh && \
    nvm use 16.16.0 && \
    cd backend && \
    npm install && \
    npm run build && \
    npx pkg . --targets node16-linux-x64"

FROM ubuntu:22.04 AS runtime


RUN useradd --user-group --system --create-home --no-log-init --shell /bin/rbash demo
RUN echo "export PATH=~/bin" >> /home/demo/.bashrc
RUN mkdir /home/demo/bin

RUN for command in "ls" "pwd" "cd" "echo" "clear" "date" "exit" "whoami" "hostname" "uname" "cat" "sleep" "groups" "dircolors"; do \
        ln -s "/usr/bin/$command" "/home/demo/bin/$command"; \
    done

COPY --from=builder /usr/src/webpty/backend/dist/bin/webpty /home/demo/bin/webpty

USER demo
ENV PATH=~/bin

EXPOSE 8900

CMD ["/bin/rbash", "-c", "webpty -s /bin/rbash"]