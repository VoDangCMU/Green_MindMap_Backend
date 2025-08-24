import user from "./userRepository";
import BitmapRepository from "@root/repository/bitmapRepository";
import { redis } from 'infrastructure/cache';

const bitmap = new BitmapRepository(redis);

export default {
    user,
    bitmap
};
