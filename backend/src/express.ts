import express from "express";
import expressWebsocket from "express-ws";

export const appWs = expressWebsocket(express())
