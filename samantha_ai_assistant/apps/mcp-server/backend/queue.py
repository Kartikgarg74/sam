import asyncio


class RequestQueue:
    def __init__(self):
        self.queue = asyncio.Queue()

    async def enqueue(self, item):
        await self.queue.put(item)

    async def dequeue(self):
        return await self.queue.get()

    def qsize(self):
        return self.queue.qsize()


queue = RequestQueue()
