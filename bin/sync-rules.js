#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const rootDir = path.resolve(__dirname, '..');
const geminiMdPath = path.join(rootDir, 'GEMINI.md');
const localSkillPath = path.join(rootDir, '.claude', 'skills', 'vibe-check', 'SKILL.md');
const globalSkillPath = path.join(os.homedir(), '.claude', 'skills', 'vibe-check', 'SKILL.md');

function getFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---[\s\S]*?---/);
  return match ? match[0] : '';
}

function sync() {
  if (!fs.existsSync(geminiMdPath)) {
    console.error('Error: GEMINI.md not found');
    process.exit(1);
  }

  const geminiContent = fs.readFileSync(geminiMdPath, 'utf-8');
  
  // Extract body rules from GEMINI.md (excluding potential frontmatter)
  const bodyRules = geminiContent.replace(/^---[\s\S]*?---/, '').trim();

  // Handle local SKILL.md frontmatter or provide default
  const localFrontmatter = getFrontmatter(localSkillPath) || `---
name: vibe-check
description: 승인 기반 원터치 자가진단 점검 모드(VIBE_CHECK_AUTORUN_MODE). "이 프로젝트 점검해서 교정해줘", "원터치 점검해줘", "vibe-check 해줘", "자가진단 MCP 적용해줘", "진단 돌리고 실패한 것 고쳐줘" 요청 시 사용. 사용자는 큰 승인만 하고, 에이전트가 상태 분리 → 진단 → 최소 수정 → 재진단 → 분리 보고까지 자동 수행한다.
---`;

  const skillContent = `${localFrontmatter}\n\n${bodyRules}\n`;

  // Write to local SKILL.md
  fs.mkdirSync(path.dirname(localSkillPath), { recursive: true });
  fs.writeFileSync(localSkillPath, skillContent, 'utf-8');
  console.log(`✅ Synchronized local skill rules: ${localSkillPath}`);

  // Write to global SKILL.md
  try {
    fs.mkdirSync(path.dirname(globalSkillPath), { recursive: true });
    fs.writeFileSync(globalSkillPath, skillContent, 'utf-8');
    console.log(`✅ Synchronized global skill rules: ${globalSkillPath}`);
  } catch (err) {
    console.warn(`⚠️ Could not sync global SKILL.md: ${err.message}`);
  }
}

sync();
