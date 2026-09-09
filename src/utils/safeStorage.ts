export class SafeStorage {
    private memory = new Map<string, string>();
    private isMemoryMode = false;

    private get storage(): Storage {
        return window.localStorage;
    }

    getItem(key: string): string | null {
        if (this.isMemoryMode) {
            return this.memory.get(key) ?? null;
        }
        try {
            return this.storage.getItem(key);
        } catch (e) {
            console.warn(
                "localStorage read failed. Switching to in-memory storage.",
                e
            );
            this.isMemoryMode = true;
            return this.memory.get(key) ?? null;
        }
    }

    setItem(key: string, value: string): boolean {
        if (this.isMemoryMode) {
            this.memory.set(key, value);
            return false;
        }
        try {
            this.storage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn(
                "localStorage write failed. Switching to in-memory storage.",
                e
            );
            this.isMemoryMode = true;
            this.memory.set(key, value);
            return false;
        }
    }

    removeItem(key: string): void {
        if (this.isMemoryMode) {
            this.memory.delete(key);
            return;
        }
        try {
            this.storage.removeItem(key);
        } catch (e) {
            console.warn(
                "localStorage remove failed. Switching to in-memory storage.",
                e
            );
            this.isMemoryMode = true;
        }
        this.memory.delete(key);
    }

    clear(): void {
        if (this.isMemoryMode) {
            this.memory.clear();
            return;
        }
        try {
            this.storage.clear();
        } catch (e) {
            console.warn(
                "localStorage clear failed. Switching to in-memory storage.",
                e
            );
            this.isMemoryMode = true;
        }
        this.memory.clear();
    }

    _reset(): void {
        this.memory.clear();
        this.isMemoryMode = false;
    }
}

export const safeStorage = new SafeStorage();
