"use client"

/**
 * The visitor's anonymous analytics session and their last search (D-105):
 * every search sends `sessionId`; the enquiry form sends both so the
 * enquiry converts the search that led to it ("last search wins").
 */
const SESSION_KEY = "wh.sessionId"
const SEARCH_KEY = "wh.lastSearchId"

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = newId()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return ""
  }
}

export function rememberSearchId(searchId: string): void {
  if (!searchId) return
  try {
    sessionStorage.setItem(SEARCH_KEY, searchId)
  } catch {
    /* storage blocked: conversion just isn't attributed */
  }
}

export function lastSearchId(): string {
  try {
    return sessionStorage.getItem(SEARCH_KEY) ?? ""
  } catch {
    return ""
  }
}

export function newIdempotencyKey(): string {
  return newId()
}
