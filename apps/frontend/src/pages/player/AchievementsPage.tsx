import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'

interface Game {
  id: string
  name: string
}

interface Board {
  id: string
  name: string
}

interface RankRow {
  rank: number
  accountId: string
  displayName: string
  value: number
}

interface GroupProgress {
  id: string
  name: string
  total: number
  obtained: number
}

interface GroupDetail {
  name: string
  achievements: { id: string; name: string; unlocked: boolean }[]
}

interface Character {
  name: string
  level: number
  rarity: number
  weapon: string
  stats: Record<string, string | number>
}

interface WorldEntry {
  name: string
  status: 'cleared' | 'in-progress' | 'locked'
}

interface SkinEntry {
  name: string
  unlocked: boolean
}

interface Summary {
  daysActive?: number
  achievements?: number
  charactersUnlocked?: number
  maxComboStreak?: number
  bestClearMode?: string
  [key: string]: unknown
}

export default function AchievementsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [mode, setMode] = useState<'MULTI' | 'SOLO' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // MULTI state
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null)
  const [rankings, setRankings] = useState<RankRow[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [myAccountId, setMyAccountId] = useState<string | null>(null)

  // SOLO state
  const [summary, setSummary] = useState<Summary | null>(null)
  const [groups, setGroups] = useState<GroupProgress[]>([])
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [worlds, setWorlds] = useState<WorldEntry[]>([])
  const [skins, setSkins] = useState<SkinEntry[]>([])

  useEffect(() => {
    loadGames()
    apiFetch('/auth/me').then((me) => setMyAccountId(me.accountId)).catch(() => {})
  }, [])

  async function loadGames() {
    setLoading(true)
    setError(null)
    try {
      const products = await apiFetch('/player/shop/browse')
      const seen = new Map<string, Game>()
      for (const p of products) {
        if (p.app && !seen.has(p.appId)) {
          seen.set(p.appId, { id: p.appId, name: p.app.name })
        }
      }
      setGames(Array.from(seen.values()))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function resetSelection() {
    setMode(null)
    setBoards([])
    setSelectedBoard(null)
    setRankings([])
    setMyRank(null)
    setSummary(null)
    setGroups([])
    setGroupDetail(null)
    setCharacters([])
    setSelectedCharacter(null)
    setWorlds([])
    setSkins([])
  }

  async function selectGame(appId: string) {
    setSelectedGame(appId)
    resetSelection()
    setError(null)
    try {
      const { mode: gameMode } = await apiFetch(`/player/ranking/mode/${appId}`)
      setMode(gameMode)
      if (gameMode === 'MULTI') {
        const boardList = await apiFetch(`/player/ranking/boards/${appId}`)
        setBoards(boardList)
        if (boardList.length > 0) selectBoard(boardList[0].id)
      } else {
        const [summaryData, progress] = await Promise.all([
          apiFetch(`/player/showcase/summary/${appId}`),
          apiFetch(`/player/showcase/achievements/${appId}/progress`),
        ])
        setSummary(summaryData?.summary ?? null)
        setCharacters(summaryData?.characters ?? [])
        setWorlds(summaryData?.worldsCleared ?? [])
        setSkins(summaryData?.skinsUnlocked ?? [])
        setGroups(progress)
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function selectBoard(boardId: string) {
    setSelectedBoard(boardId)
    try {
      const [scores, rankData] = await Promise.all([
        apiFetch(`/player/ranking/${boardId}?scope=GLOBAL`),
        apiFetch(`/player/ranking/${boardId}/my-rank`),
      ])
      setRankings(scores)
      setMyRank(rankData.rank)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function openGroup(groupId: string) {
    try {
      const detail = await apiFetch(`/player/showcase/achievements/group/${groupId}`)
      setGroupDetail(detail)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <p>Loading games...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h2>Achievements & Rankings</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => selectGame(g.id)}
            style={{ fontWeight: selectedGame === g.id ? 'bold' : 'normal' }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {selectedGame && mode === 'MULTI' && (
        <div>
          <h3>Rankings</h3>
          {boards.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBoard(b.id)}
                  style={{ marginRight: 8, fontWeight: selectedBoard === b.id ? 'bold' : 'normal' }}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
          {myRank != null && (
            <div style={{ background: '#eef', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              Your rank: <strong>#{myRank}</strong>
            </div>
          )}
          {rankings.length === 0 && <p>No scores submitted yet.</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Player</th>
                <th style={{ padding: 8 }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr
                  key={r.accountId}
                  style={{
                    borderBottom: '1px solid #eee',
                    background: r.accountId === myAccountId ? '#ffe' : 'transparent',
                    fontWeight: r.accountId === myAccountId ? 'bold' : 'normal',
                  }}
                >
                  <td style={{ padding: 8 }}>{r.rank}</td>
                  <td style={{ padding: 8 }}>{r.displayName}</td>
                  <td style={{ padding: 8 }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedGame && mode === 'SOLO' && (
        <div>
          {summary && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              {Object.entries(summary).map(([key, value]) => (
                <div key={key} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, minWidth: 120 }}>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>{String(value)}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{key}</div>
                </div>
              ))}
            </div>
          )}

          <h3>Achievements</h3>
          {groups.length === 0 && <p>No achievements for this game yet.</p>}
          {groups.map((g) => (
            <div
              key={g.id}
              onClick={() => openGroup(g.id)}
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{g.name}</strong>
                <span>{g.obtained}/{g.total}</span>
              </div>
              <div style={{ background: '#eee', borderRadius: 4, height: 8, marginTop: 6 }}>
                <div
                  style={{
                    width: `${g.total ? (g.obtained / g.total) * 100 : 0}%`,
                    background: '#4a90d9',
                    height: 8,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}

          {groupDetail && (
            <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4>{groupDetail.name}</h4>
                <button onClick={() => setGroupDetail(null)}>Close</button>
              </div>
              <ul>
                {groupDetail.achievements.map((a) => (
                  <li key={a.id} style={{ color: a.unlocked ? 'inherit' : '#aaa' }}>
                    {a.unlocked ? '✓' : '○'} {a.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {worlds.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3>Worlds Cleared</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {worlds.map((w) => (
                  <div
                    key={w.name}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: '8px 12px',
                      background:
                        w.status === 'cleared' ? '#e6f4e6' : w.status === 'in-progress' ? '#fff8e0' : '#f0f0f0',
                      color: w.status === 'locked' ? '#999' : 'inherit',
                    }}
                  >
                    {w.name} {w.status === 'cleared' ? '✓' : w.status === 'in-progress' ? '…' : '🔒'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {skins.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3>Skins Unlocked</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {skins.map((s) => (
                  <div
                    key={s.name}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: '8px 12px',
                      opacity: s.unlocked ? 1 : 0.4,
                    }}
                  >
                    {s.name} {s.unlocked ? '✓' : '🔒'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {characters.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3>Characters</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {characters.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCharacter(c)}
                    style={{ fontWeight: selectedCharacter?.name === c.name ? 'bold' : 'normal' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {selectedCharacter && (
                <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                  <h4>
                    {selectedCharacter.name} — Lv. {selectedCharacter.level}{' '}
                    <span style={{ color: '#e0a800' }}>{'★'.repeat(selectedCharacter.rarity)}</span>
                  </h4>
                  <p>Weapon: {selectedCharacter.weapon}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 400 }}>
                    {Object.entries(selectedCharacter.stats).map(([stat, value]) => (
                      <div key={stat} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>{stat}</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
