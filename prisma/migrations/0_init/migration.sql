-- CreateTable
CREATE TABLE "Config" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "postChannel" TEXT NOT NULL,
    "logChannel" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UsernamePart" (
    "word" TEXT NOT NULL,
    "part" TEXT NOT NULL,

    PRIMARY KEY ("word", "part")
);

-- CreateTable
CREATE TABLE "User" (
    "discordId" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "image" TEXT,
    "authorId" TEXT NOT NULL,
    "channelId" TEXT,
    "messageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("discordId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostVote" (
    "postId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    CONSTRAINT "PostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discordId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostAward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "awardId" INTEGER NOT NULL,
    CONSTRAINT "PostAward_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostAward_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "StoreItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emoji" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StorePurchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StorePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discordId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StorePurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StoreItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PostVote_postId_userId_key" ON "PostVote"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreItem_name_key" ON "StoreItem"("name");

