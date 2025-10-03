-- Reaper MIDI & Automation Collaboration ReaScript
-- This script integrates with the Node.js collaboration system

-- Configuration
local SERVER_URL = "ws://localhost:8080"
local POLL_INTERVAL = 0.1  -- seconds

-- Global state
local isConnected = false
local lastProjectState = {}
local bridgeFilePath = reaper.GetResourcePath() .. "/Scripts/collab_bridge.json"

-- Utility Functions

function WriteToFile(filepath, content)
  local file = io.open(filepath, "w")
  if file then
    file:write(content)
    file:close()
    return true
  end
  return false
end

function ReadFromFile(filepath)
  local file = io.open(filepath, "r")
  if file then
    local content = file:read("*all")
    file:close()
    return content
  end
  return nil
end

function SerializeTable(tbl)
  -- Simple JSON-like serialization
  local result = "{"
  local first = true
  for k, v in pairs(tbl) do
    if not first then
      result = result .. ","
    end
    first = false
    
    if type(k) == "string" then
      result = result .. '"' .. k .. '":'
    else
      result = result .. k .. ':'
    end
    
    if type(v) == "table" then
      result = result .. SerializeTable(v)
    elseif type(v) == "string" then
      result = result .. '"' .. v .. '"'
    elseif type(v) == "number" then
      result = result .. v
    elseif type(v) == "boolean" then
      result = result .. (v and "true" or "false")
    end
  end
  result = result .. "}"
  return result
end

-- MIDI Functions

function GetMidiData()
  local midiData = {}
  local trackCount = reaper.CountTracks(0)
  
  for i = 0, trackCount - 1 do
    local track = reaper.GetTrack(0, i)
    local itemCount = reaper.CountTrackMediaItems(track)
    
    for j = 0, itemCount - 1 do
      local item = reaper.GetTrackMediaItem(track, j)
      local take = reaper.GetActiveTake(item)
      
      if take and reaper.TakeIsMIDI(take) then
        local itemStart = reaper.GetMediaItemInfo_Value(item, "D_POSITION")
        local itemLength = reaper.GetMediaItemInfo_Value(item, "D_LENGTH")
        
        local midiItem = {
          trackIndex = i,
          itemIndex = j,
          position = itemStart,
          length = itemLength,
          events = {}
        }
        
        local _, notecnt = reaper.MIDI_CountEvts(take)
        for k = 0, notecnt - 1 do
          local _, selected, muted, startppq, endppq, chan, pitch, vel = 
            reaper.MIDI_GetNote(take, k)
          
          table.insert(midiItem.events, {
            index = k,
            startppq = startppq,
            endppq = endppq,
            channel = chan,
            pitch = pitch,
            velocity = vel,
            selected = selected,
            muted = muted
          })
        end
        
        table.insert(midiData, midiItem)
      end
    end
  end
  
  return midiData
end

-- Automation Functions

function GetAutomationData()
  local automationData = {}
  local trackCount = reaper.CountTracks(0)
  
  for i = 0, trackCount - 1 do
    local track = reaper.GetTrack(0, i)
    local _, trackName = reaper.GetTrackName(track)
    
    -- Get volume envelope
    local volEnv = reaper.GetTrackEnvelopeByName(track, "Volume")
    if volEnv then
      local envData = GetEnvelopePoints(volEnv)
      if #envData > 0 then
        table.insert(automationData, {
          trackIndex = i,
          trackName = trackName,
          type = "VOLUME",
          points = envData
        })
      end
    end
    
    -- Get pan envelope
    local panEnv = reaper.GetTrackEnvelopeByName(track, "Pan")
    if panEnv then
      local envData = GetEnvelopePoints(panEnv)
      if #envData > 0 then
        table.insert(automationData, {
          trackIndex = i,
          trackName = trackName,
          type = "PAN",
          points = envData
        })
      end
    end
  end
  
  return automationData
end

function GetEnvelopePoints(envelope)
  local points = {}
  local pointCount = reaper.CountEnvelopePoints(envelope)
  
  for i = 0, pointCount - 1 do
    local _, time, value, shape, tension, selected = 
      reaper.GetEnvelopePoint(envelope, i)
    
    table.insert(points, {
      index = i,
      time = time,
      value = value,
      shape = shape,
      tension = tension,
      selected = selected
    })
  end
  
  return points
end

-- Main Loop

function Main()
  -- Check if project is open
  local project = reaper.EnumProjects(-1)
  if not project then
    return
  end
  
  -- Collect current state
  local currentState = {
    midi = GetMidiData(),
    automation = GetAutomationData(),
    timestamp = reaper.time_precise()
  }
  
  -- Write state to bridge file
  local stateJson = SerializeTable(currentState)
  WriteToFile(bridgeFilePath, stateJson)
  
  -- Check for changes from other clients
  local changesFile = reaper.GetResourcePath() .. "/Scripts/collab_changes.json"
  local changesJson = ReadFromFile(changesFile)
  
  if changesJson then
    -- Apply changes (this would be expanded with actual change application logic)
    -- For now, just delete the file to acknowledge receipt
    os.remove(changesFile)
  end
  
  -- Schedule next run
  reaper.defer(Main)
end

-- Initialize

function Init()
  reaper.ShowConsoleMsg("Reaper MIDI & Automation Collaboration Script Started\n")
  reaper.ShowConsoleMsg("Bridge file: " .. bridgeFilePath .. "\n")
  Main()
end

-- Start the script
Init()
