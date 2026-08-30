import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Card, StatCard, ProgressBar, Pill, Button } from '../../components/ui'
import { tokens, gameAccent } from '../../theme/tokens'

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
  [key: string]: unknown
}

export default function AchievementsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [mode, setMode] = useState<'MULTI' | 'SOLO' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null)
  const [rankings, setRankings] = useState<RankRow[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [myAccountId, setMyAccountId] = useState<string | null>(null)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [groups, setGroups] = useState<GroupProgress[]>([])
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [worlds, setWorlds] = useState<WorldEntry[]>([])
  const [skins, setSkins] = useState<SkinEntry[]>([])

  const currentAccent = selectedGame ? gameAccent(games.find((g) => g.id === selectedGame)?.name ?? '') : tokens.color.accent

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

  if (loading) return <p style={{ padding: 24, color: tokens.color.textMuted }}>Loading games...</p>
  if (error) return <p style={{ padding: 24, color: tokens.color.danger }}>{error}</p>

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Achievements & Rankings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18, marginBottom: 32 }}>
        {games.map((g) => {
          const accent = gameAccent(g.name)
          const active = selectedGame === g.id
          return (
            <Card
              key={g.id}
              onClick={() => selectGame(g.id)}
              style={{
                position: 'relative',
                textAlign: 'left',
                padding: '32px 28px',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: active ? accent : tokens.color.surface,
                border: `2px solid ${accent}`,
                borderTop: `2px solid ${accent}`,
                transform: active ? 'translateY(-3px)' : 'none',
                boxShadow: active ? `0 8px 24px ${accent}55` : tokens.shadow.card,
              }}
            >
              <div
                style={{
                  fontFamily: tokens.font.display,
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: active ? '#0C0D12' : tokens.color.text,
                }}
              >
                {g.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  marginTop: 16,
                  color: active ? 'rgba(12,13,18,0.7)' : tokens.color.textMuted,
                }}
              >
                ENTER →
              </div>
            </Card>
          )
        })}
      </div>

      {selectedGame && mode === 'MULTI' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 6, height: 22, background: currentAccent, borderRadius: 2 }} />
            <h2 style={{ fontSize: 16, margin: 0 }}>Rankings</h2>
          </div>

          {boards.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {boards.map((b) => (
                <Button
                  key={b.id}
                  variant={selectedBoard === b.id ? 'primary' : 'secondary'}
                  onClick={() => selectBoard(b.id)}
                >
                  {b.name}
                </Button>
              ))}
            </div>
          )}

          {myRank != null && (
            <Card accent={currentAccent} style={{ marginBottom: 16, display: 'inline-block' }}>
              Your rank: <strong style={{ color: tokens.color.gold }}>#{myRank}</strong>
            </Card>
          )}

          {rankings.length === 0 && <p style={{ color: tokens.color.textMuted }}>No scores submitted yet.</p>}

          {rankings.length > 0 && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <th style={{ padding: 12, color: tokens.color.textMuted, fontSize: 12 }}>#</th>
                    <th style={{ padding: 12, color: tokens.color.textMuted, fontSize: 12 }}>Player</th>
                    <th style={{ padding: 12, color: tokens.color.textMuted, fontSize: 12 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr
                      key={r.accountId}
                      style={{
                        borderBottom: `1px solid ${tokens.color.border}`,
                        background: r.accountId === myAccountId ? 'rgba(108,92,231,0.15)' : 'transparent',
                        fontWeight: r.accountId === myAccountId ? 700 : 400,
                      }}
                    >
                      <td style={{ padding: 12 }}>{r.rank}</td>
                      <td style={{ padding: 12 }}>{r.displayName}</td>
                      <td style={{ padding: 12, fontFamily: tokens.font.mono }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {selectedGame && mode === 'SOLO' && (
        <div>
          {summary && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
              {Object.entries(summary).map(([key, value]) => (
                <StatCard key={key} label={key} value={String(value)} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 6, height: 22, background: currentAccent, borderRadius: 2 }} />
            <h2 style={{ fontSize: 16, margin: 0 }}>Achievements</h2>
          </div>

          {groups.length === 0 && <p style={{ color: tokens.color.textMuted }}>No achievements for this game yet.</p>}

          {groups.map((g) => (
            <Card key={g.id} accent={currentAccent} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => openGroup(g.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{g.name}</strong>
                <span style={{ fontFamily: tokens.font.mono, color: tokens.color.textMuted }}>
                  {g.obtained}/{g.total}
                </span>
              </div>
              <ProgressBar current={g.obtained} total={g.total} color={currentAccent} />
            </Card>
          ))}

          {groupDetail && (
            <Card style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{groupDetail.name}</h3>
                <Button variant="ghost" onClick={() => setGroupDetail(null)}>Close</Button>
              </div>
              {groupDetail.achievements.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Pill tone={a.unlocked ? 'success' : 'locked'}>{a.unlocked ? '✓' : '○'}</Pill>
                  <span style={{ color: a.unlocked ? tokens.color.text : tokens.color.textMuted }}>{a.name}</span>
                </div>
              ))}
            </Card>
          )}

          {worlds.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 6, height: 22, background: currentAccent, borderRadius: 2 }} />
                <h2 style={{ fontSize: 16, margin: 0 }}>Worlds Cleared</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {worlds.map((w) => (
                  <Pill key={w.name} tone={w.status === 'cleared' ? 'success' : w.status === 'in-progress' ? 'warning' : 'locked'}>
                    {w.name} {w.status === 'cleared' ? '✓' : w.status === 'in-progress' ? '…' : '🔒'}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {skins.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 6, height: 22, background: currentAccent, borderRadius: 2 }} />
                <h2 style={{ fontSize: 16, margin: 0 }}>Skins Unlocked</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {skins.map((s) => (
                  <Pill key={s.name} tone={s.unlocked ? 'success' : 'locked'}>
                    {s.name} {s.unlocked ? '✓' : '🔒'}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {characters.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 6, height: 22, background: currentAccent, borderRadius: 2 }} />
                <h2 style={{ fontSize: 16, margin: 0 }}>Characters</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {characters.map((c) => (
                  <Button
                    key={c.name}
                    variant={selectedCharacter?.name === c.name ? 'primary' : 'secondary'}
                    onClick={() => setSelectedCharacter(c)}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>

              {selectedCharacter && (
                <Card accent={currentAccent}>
                  <h3 style={{ margin: '0 0 4px' }}>
                    {selectedCharacter.name} — Lv. {selectedCharacter.level}{' '}
                    <span style={{ color: tokens.color.gold }}>{'★'.repeat(selectedCharacter.rarity)}</span>
                  </h3>
                  <p style={{ color: tokens.color.textMuted, marginTop: 0 }}>Weapon: {selectedCharacter.weapon}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 400 }}>
                    {Object.entries(selectedCharacter.stats).map(([stat, value]) => (
                      <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: tokens.color.textMuted }}>{stat}</span>
                        <span style={{ fontFamily: tokens.font.mono }}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
