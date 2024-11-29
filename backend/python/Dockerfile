FROM python:3

ENV PYTHONUNBUFFERED 1
ENV SECRET_KEY=${SECRET_KEY}

WORKDIR /app

COPY requirement.txt  ./

COPY init.sh /usr/bin/

RUN python3 -m pip install  --no-cache-dir -r requirement.txt

ENTRYPOINT [ "sh", "/usr/bin/init.sh" ]
