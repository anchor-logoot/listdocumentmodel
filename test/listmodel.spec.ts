import { expect } from 'chai'
import { DTst } from '@anchor-logoot/dtst-js'
import {
  AnchorLogootNode,
  NodeType,
  DocStart,
  DocEnd,
  LeftAnchor,
  RightAnchor
} from '../src/listmodel/node'
import { BranchOrder } from '../src/listmodel/branch'
import {
  OperationBuffer,
  constructSkipRanges,
  fillSkipRanges,
  linkFilledSkipRanges,
  LogootPosition,
  ListDocumentModel,
  LogootInt
} from '../src/listmodel'

describe('AnchorLogootNode', () => {
  let o: BranchOrder
  const u1 = 'U1'
  const u2 = 'U2'
  const u3 = 'U3'
  beforeEach(() => {
    o = new BranchOrder()
    o.i(u1)
    o.i(u2)
    o.i(u3)
  })

  it('preferential_cmp orders by start', () => {
    const a = new AnchorLogootNode(
      LogootPosition.fromIntsBranches(o, [1, u1]),
      10
    )
    const b = new AnchorLogootNode(
      LogootPosition.fromIntsBranches(o, [3, u1]),
      2
    )
    expect(a.preferential_cmp(b)).to.be.equal(-1)
  })

  describe('property getters', () => {
    it('correctly calculated logoot end', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      const end = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [8, u1])
      expect(node.logoot_end.eq(end)).to.be.true
    })
    it('correctly aliased ldoc start', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      node.value = 2
      expect(node.ldoc_start).to.be.equal(2)
    })
    it('correctly calculated ldoc end', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      node.value = 2
      expect(node.ldoc_end).to.be.equal(7)
    })
    describe('ldoc_length', () => {
      it('is non-zero for data', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        node.value = 2
        expect(node.ldoc_length).to.be.equal(5)
      })
      it('is zero for everything else', () => {
        const node1 = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5,
          NodeType.REMOVAL
        )
        const node2 = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5,
          NodeType.DUMMY
        )
        expect(node1.ldoc_length).to.be.equal(0)
        expect(node2.ldoc_length).to.be.equal(0)
      })
    })
    describe('true_left', () => {
      it('Returns the left anchor when present', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        node.left_anchor = LogootPosition.fromIntsBranches(o, [1, u1], [1, u1])
        expect(node.true_left).to.be.an.instanceOf(LogootPosition)
        expect((node.true_left as LogootPosition).eq(node.left_anchor))
          .to.be.true
      })
      it('Defaults to the Logoot start', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        expect(node.true_left).to.be.an.instanceOf(LogootPosition)
        expect((node.true_left as LogootPosition).eq(node.logoot_start))
          .to.be.true
      })
    })
    describe('true_right', () => {
      it('Returns the right anchor when present', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        node.right_anchor = LogootPosition.fromIntsBranches(o, [1, u1], [5, u1])
        expect(node.true_right).to.be.an.instanceOf(LogootPosition)
        expect((node.true_right as LogootPosition).eq(node.right_anchor))
          .to.be.true
      })
      it('Defaults to the Logoot end', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        expect(node.true_right).to.be.an.instanceOf(LogootPosition)
        expect((node.true_right as LogootPosition).eq(node.logoot_end))
          .to.be.true
      })
    })
  })

  describe('positionOf', () => {
    it('should return `undefined` if on higher level', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1])
      expect(node.positionOf(pos)).to.be.undefined
    })
    it('should return `undefined` if less', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [1, u1])
      expect(node.positionOf(pos)).to.be.undefined
    })
    it('should return `undefined` if greater', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [9, u1])
      expect(node.positionOf(pos)).to.be.undefined
    })
    it('should be correct in range', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [5, u1])
      expect(node.positionOf(pos)).to.be.equal(2)
    })
  })

  describe('splitAround', () => {
    it('should throw error if length < 2', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        1
      )
      expect(() => node.splitAround(1)).to.throw(
        TypeError, 'This node cannot be split. It is too small.'
      )
    })
    it('should throw error if position not in middle of node', () => {
      const node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
        5
      )
      expect(() => node.splitAround(0)).to.throw(
        TypeError, 'The split position is not in the node.'
      )
      expect(() => node.splitAround(5)).to.throw(
        TypeError, 'The split position is not in the node.'
      )
    })
    it('should generate correct positions', () => {
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1])
      const n1 = new AnchorLogootNode(pos, 5)
      n1.value = 2
      const n2 = n1.splitAround(2)
      expect(n1.logoot_start.eq(pos)).to.be.true
      expect(n1.length).to.be.equal(2)
      expect(n1.ldoc_start).to.be.equal(2)
      expect(n2.logoot_start.eq(pos.offsetLowest(2))).to.be.true
      expect(n2.length).to.be.equal(3)
      expect(n2.ldoc_start).to.be.equal(4)
    })
    it('should preserve types', () => {
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1])

      const n1 = new AnchorLogootNode(pos, 5, NodeType.REMOVAL)
      const n2 = n1.splitAround(2)

      const n3 = new AnchorLogootNode(pos, 5, NodeType.DUMMY)
      const n4 = n3.splitAround(2)

      expect(n2.type).to.be.equal(NodeType.REMOVAL)
      expect(n4.type).to.be.equal(NodeType.DUMMY)
    })
    it('should copy conflicts', () => {
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1])
      const c = new AnchorLogootNode(pos.inverseOffsetLowest(20), 5)
      c.right_anchor = pos.offsetLowest(20)

      const n1 = new AnchorLogootNode(pos, 5)
      n1.conflict_with.add(c)
      const n2 = n1.splitAround(2)

      expect(n1.conflict_with).to.not.be.equal(n2.conflict_with)
      expect(n1.conflict_with).to.be.deep.equal(n2.conflict_with)
    })
    it('should reassign anchors', () => {
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1])

      const n1 = new AnchorLogootNode(pos, 5)
      n1.left_anchor = pos.inverseOffsetLowest(20)
      n1.right_anchor = pos.offsetLowest(20)
      const n2 = n1.splitAround(2)

      expect(n1.true_left).to.be.an.instanceOf(LogootPosition)
      expect((n1.true_left as LogootPosition).eq(pos.inverseOffsetLowest(20)))
        .to.be.true
      expect(n1.true_right).to.be.an.instanceOf(LogootPosition)
      expect((n1.true_right as LogootPosition).eq(pos.offsetLowest(2)))
        .to.be.true

      expect(n2.true_left).to.be.an.instanceOf(LogootPosition)
      expect((n2.true_left as LogootPosition).eq(pos.offsetLowest(2)))
        .to.be.true
      expect(n2.true_right).to.be.an.instanceOf(LogootPosition)
      expect((n2.true_right as LogootPosition).eq(pos.offsetLowest(20)))
        .to.be.true
    })
    it('should reassign conflicts by defaulting to `inorder_successor`', () => {
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1])
      const c1 = new AnchorLogootNode(pos.offsetLowest(10), 2)
      const c2 = new AnchorLogootNode(pos.offsetLowest(14), 3)
      c1.value = 7
      c2.value = 9
      c1.addChild(c2)

      const n1 = new AnchorLogootNode(pos, 5)
      n1.value = 2
      n1.addChild(c1)
      n1.right_anchor = pos.offsetLowest(20)
      c1.conflict_with.add(n1)
      c2.conflict_with.add(n1)
      const n2 = n1.splitAround(2)

      expect(c1.conflict_with.has(n1)).to.be.false
      expect(c2.conflict_with.has(n1)).to.be.false
      expect(c1.conflict_with.has(n2)).to.be.true
      expect(c2.conflict_with.has(n2)).to.be.true
    })
    it('should reassign conflicts by using the provided iterator', () => {
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1])
      const c1 = new AnchorLogootNode(pos.offsetLowest(10), 2)
      const c2 = new AnchorLogootNode(pos.offsetLowest(14), 3)

      const n1 = new AnchorLogootNode(pos, 5)
      n1.right_anchor = pos.offsetLowest(20)
      c1.conflict_with.add(n1)
      c2.conflict_with.add(n1)
      const n2 = n1.splitAround(2, [c1, c2].values())

      expect(c1.conflict_with.has(n1)).to.be.false
      expect(c2.conflict_with.has(n1)).to.be.false
      expect(c1.conflict_with.has(n2)).to.be.true
      expect(c2.conflict_with.has(n2)).to.be.true
    })
    it('should not offset removal ldoc position', () => {
      const pos = LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1])
      const n1 = new AnchorLogootNode(pos, 5, NodeType.REMOVAL)
      n1.value = 2
      const n2 = n1.splitAround(2)
      expect(n2.logoot_start.eq(pos.offsetLowest(2))).to.be.true
      expect(n2.length).to.be.equal(3)
      expect(n2.ldoc_start).to.be.equal(2)
    })
  })

  describe('reductions', () => {
    describe('reduceLeft', () => {
      it('reducing with start should have no effect', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [1, u1])
        node.left_anchor = pos
        node.reduceLeft(DocStart)
        expect(node.left_anchor.eq(pos)).to.be.true
      })
      it('will not reduce when current is closer', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [1, u1])
        node.left_anchor = pos
        node.reduceLeft(LogootPosition.fromIntsBranches(o, [1, u1], [0, u1]))
        expect(node.left_anchor.eq(pos)).to.be.true
      })
      it('will not reduce when new is after start', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [3, u1])
        node.reduceLeft(pos)
        expect(node.left_anchor).to.be.undefined
      })
      it('will reduce when new is closer', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [1, u1])
        node.left_anchor = LogootPosition.fromIntsBranches(o, [1, u1], [0, u1])
        node.reduceLeft(pos)
        expect(node.left_anchor.eq(pos)).to.be.true
      })
      it('reduction is undefined when equal to start', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1]),
          5
        )
        node.left_anchor = LogootPosition.fromIntsBranches(o, [1, u1], [1, u1])
        node.reduceLeft(LogootPosition.fromIntsBranches(o, [1, u1], [2, u1]))
        expect(node.left_anchor).to.be.undefined
      })
    })
    describe('reduceRight', () => {
      it('reducing with start should have no effect', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [10, u1])
        node.right_anchor = pos
        node.reduceRight(DocEnd)
        expect(node.right_anchor.eq(pos)).to.be.true
      })
      it('will not reduce when current is closer', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [10, u1])
        node.right_anchor = pos
        node.reduceRight(LogootPosition.fromIntsBranches(o, [1, u1], [12, u1]))
        expect(node.right_anchor.eq(pos)).to.be.true
      })
      it('will not reduce when new is before end', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [1, u1])
        node.reduceRight(pos)
        expect(node.right_anchor).to.be.undefined
      })
      it('will reduce when new is closer', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1], [3, u1]),
          5
        )
        const pos = LogootPosition.fromIntsBranches(o, [1, u1], [10, u1])
        node.right_anchor = LogootPosition.fromIntsBranches(
          o,
          [1, u1],
          [12, u1]
        )
        node.reduceRight(pos)
        expect(node.right_anchor.eq(pos)).to.be.true
      })
      it('reduction is undefined when equal to end', () => {
        const node = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [1, u1], [2, u1]),
          5
        )
        node.right_anchor = LogootPosition.fromIntsBranches(o, [1, u1], [9, u1])
        node.reduceRight(LogootPosition.fromIntsBranches(o, [1, u1], [7, u1]))
        expect(node.right_anchor).to.be.undefined
      })
    })
  })

  describe('addConflictsFromNode', () => {
    describe('left', () => {
      it('should add conflict to end', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          1
        )
        a.right_anchor = DocEnd
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          1
        )
        expect(b.addConflictsFromNode(a)).to.be.deep.equal({
          node: undefined,
          added: true
        })
        expect(b.conflict_with.has(a)).to.be.true
      })
      it('should add conflict past node', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          1
        )
        a.right_anchor = LogootPosition.fromIntsBranches(o, [5, u1])
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          1
        )
        expect(b.addConflictsFromNode(a)).to.be.deep.equal({
          node: undefined,
          added: true
        })
        expect(b.conflict_with.has(a)).to.be.true
      })
      it('should add conflict to node end', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          1
        )
        a.right_anchor = LogootPosition.fromIntsBranches(o, [4, u1])
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          1
        )
        expect(b.addConflictsFromNode(a)).to.be.deep.equal({
          node: undefined,
          added: true
        })
        expect(b.conflict_with.has(a)).to.be.true
      })
      it('should split node if necessary (and return new node)', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          1
        )
        a.right_anchor = LogootPosition.fromIntsBranches(o, [4, u1])
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          2
        )
        const { node, added } = b.addConflictsFromNode(a)
        expect(added).to.be.true
        expect(node).to.not.be.undefined
        expect(b.conflict_with.has(a)).to.be.true
        expect(node.conflict_with.has(a)).to.be.false
      })
    })
    describe('right', () => {
      it('should add conflict to start', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          1
        )
        a.left_anchor = DocStart
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          1
        )
        expect(b.addConflictsFromNode(a)).to.be.deep.equal({
          node: undefined,
          added: true
        })
        expect(b.conflict_with.has(a)).to.be.true
      })
      it('should add conflict past node', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          1
        )
        a.left_anchor = LogootPosition.fromIntsBranches(o, [-5, u1])
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          1
        )
        expect(b.addConflictsFromNode(a)).to.be.deep.equal({
          node: undefined,
          added: true
        })
        expect(b.conflict_with.has(a)).to.be.true
      })
      it('should add conflict to node start', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          1
        )
        a.left_anchor = LogootPosition.fromIntsBranches(o, [0, u1])
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          1
        )
        expect(b.addConflictsFromNode(a)).to.be.deep.equal({
          node: undefined,
          added: true
        })
        expect(b.conflict_with.has(a)).to.be.true
      })
      it('should split node if necessary (and return new node)', () => {
        const a = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [3, u1]),
          1
        )
        a.left_anchor = LogootPosition.fromIntsBranches(o, [1, u1])
        const b = new AnchorLogootNode(
          LogootPosition.fromIntsBranches(o, [0, u1]),
          2
        )
        const { node, added } = b.addConflictsFromNode(a)
        expect(added).to.be.true
        expect(node).to.not.be.undefined
        expect(b.conflict_with.has(a)).to.be.false
        expect(node.conflict_with.has(a)).to.be.true
      })
    })
  })

  describe('updateNeighborConflicts', () => {
    it('should work for basic conflict detection', () => {
      const a = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u1]),
        1
      )
      a.left_anchor = DocStart
      a.right_anchor = DocEnd
      const b = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u2]),
        1
      )
      b.left_anchor = DocStart
      b.right_anchor = DocEnd
      const c = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u3]),
        1
      )
      c.left_anchor = DocStart
      c.right_anchor = DocEnd
      b.updateNeighborConflicts(a, () => { throw Error('Should not happen') })
      c.updateNeighborConflicts(b, () => { throw Error('Should not happen') })
      expect(b.conflict_with.has(a)).to.be.true
      expect(c.conflict_with.has(b)).to.be.true
      expect(c.conflict_with.has(a)).to.be.true
    })
    it('should split node if necessary', () => {
      const a = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u1]),
        1
      )
      a.left_anchor = DocStart
      a.right_anchor = LogootPosition.fromIntsBranches(o, [1, u2])
      const b = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u2]),
        2
      )
      b.left_anchor = DocStart
      b.right_anchor = DocEnd
      let newnode: AnchorLogootNode
      b.updateNeighborConflicts(a, (n) => {
        if (newnode) {
          throw Error('Should not happen')
        }
        newnode = n
      })
      expect(b.conflict_with.has(a)).to.be.true
      expect(newnode).to.not.be.undefined
      expect(newnode.conflict_with.has(a)).to.be.false
    })
  })
})


const expectAnchors = (
  node: AnchorLogootNode,
  l: LeftAnchor,
  r: RightAnchor
): void => {
  if (l === DocStart) {
    expect(node.true_left).to.be.equal(l)
  } else {
    expect(node.true_left).to.be.an.instanceOf(LogootPosition)
    expect((node.true_left as LogootPosition).eq(l)).to.be.true
  }
  if (r === DocEnd) {
    expect(node.true_right).to.be.equal(r)
  } else {
    expect(node.true_right).to.be.an.instanceOf(LogootPosition)
    expect((node.true_right as LogootPosition).eq(r)).to.be.true
  }
}

describe('LDM support functions', () => {
  const u1 = 'U1'
  const u2 = 'U2'
  const u3 = 'U3'
  let o: BranchOrder
  beforeEach(() => {
    o = new BranchOrder()
    o.i(u1)
    o.i(u2)
    o.i(u3)
  })
  const p = (...ns: number[]): LogootPosition =>
    LogootPosition.fromIntsBranches(
      o,
      ...ns.map((n) => [n, u1]) as [number, string][]
    )
  describe('constructSkipRanges', () => {
    let bst: DTst<AnchorLogootNode>
    beforeEach(() => {
      bst = new DTst<AnchorLogootNode>()
    })
    it('should default to a dummy node in skip ranges', () => {
      const start = LogootPosition.fromIntsBranches(o, [5, u2], [0, u2])
      const end = LogootPosition.fromIntsBranches(o, [5, u2], [2, u2])
      const d = constructSkipRanges(bst, { start, end })

      expect(d.skip_ranges.length).to.be.equal(1)
      expect(d.skip_ranges[0].type).to.be.equal(NodeType.DUMMY)
      expect(d.skip_ranges[0].ldoc_start).to.be.equal(0)
      expect(
        d.skip_ranges[0].logoot_start
          .cmp(LogootPosition.fromIntsBranches(o, [5, u2], [2, u2]))
      ).to.be.equal(0)
      expect(d.lesser).to.be.undefined
      expect(d.greater).to.be.undefined
    })
    it('should place nodes into correct category', () => {
      const start = LogootPosition.fromIntsBranches(o, [2, u1])
      const end = LogootPosition.fromIntsBranches(o, [4, u1])

      const nodes = ([0,1,2,3,4,5]).map((i) => {
        const n = new AnchorLogootNode(p(i), 1)
        n.value = i
        return n
      })
      nodes.forEach((n) => bst.add(n))
      const d = constructSkipRanges(bst, { start, end })

      expect(d.lesser).to.be.equal(nodes[1])
      expect(d.skip_ranges).to.have.same.members(nodes.slice(2, 4))
      expect(d.greater).to.be.equal(nodes[4])
    })
    it('should infer position for dummy node', () => {
      const start = LogootPosition.fromIntsBranches(o, [5, u2])
      const end = LogootPosition.fromIntsBranches(o, [9000, u2])

      bst.add(new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u1]),
        1
      ))
      const { skip_ranges } = constructSkipRanges(bst, { start, end })

      expect(skip_ranges.length).to.be.equal(1)
      expect(skip_ranges[0].type).to.be.equal(NodeType.DUMMY)
      expect(skip_ranges[0].ldoc_start).to.be.equal(1, 'Did not infer pos')
      expect(
        skip_ranges[0].logoot_start
          .cmp(LogootPosition.fromIntsBranches(o, [9000, u2]))
      ).to.be.equal(0)
    })
    it('should split into skip_ranges', () => {
      const start = LogootPosition.fromIntsBranches(o, [2, u1])
      const end = LogootPosition.fromIntsBranches(o, [4, u1])

      const n = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u1]),
        3
      )
      bst.add(n)
      const { lesser, skip_ranges, greater } = constructSkipRanges(
        bst,
        { start, end }
      )

      expect(lesser).to.be.equal(n)

      expect(skip_ranges.length).to.be.equal(2)
      expect(
        skip_ranges[0].logoot_start
          .cmp(LogootPosition.fromIntsBranches(o, [2, u1]))
      ).to.be.equal(0)
      expect(skip_ranges[0].ldoc_start).to.be.equal(2)
      expect(skip_ranges[0].length).to.be.equal(1)

      expect(
        skip_ranges[1].logoot_start
          .cmp(LogootPosition.fromIntsBranches(o, [4, u1]))
      ).to.be.equal(0)
      expect(skip_ranges[1].ldoc_start).to.be.equal(3)
      expect(skip_ranges[1].type).to.be.equal(NodeType.DUMMY)

      expect(greater).to.be.undefined
    })
    it('should split multiple times', () => {
      const start = LogootPosition.fromIntsBranches(o, [2, u1])
      const end = LogootPosition.fromIntsBranches(o, [4, u1])

      const n = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [0, u1]),
        10
      )
      bst.add(n)
      const { lesser, skip_ranges, greater } = constructSkipRanges(
        bst,
        { start, end }
      )

      expect(lesser).to.be.equal(n)

      expect(skip_ranges.length).to.be.equal(1)
      expect(
        skip_ranges[0].logoot_start
          .cmp(LogootPosition.fromIntsBranches(o, [2, u1]))
      ).to.be.equal(0)
      expect(skip_ranges[0].ldoc_start).to.be.equal(2)
      expect(skip_ranges[0].length).to.be.equal(2)

      expect(
        greater.logoot_start
          .cmp(LogootPosition.fromIntsBranches(o, [4, u1]))
      ).to.be.equal(0)
      expect(greater.ldoc_start).to.be.equal(4)
      expect(greater.length).to.be.equal(6)
    })
  })
  describe('fillSkipRanges', () => {
    let opbuf: OperationBuffer
    beforeEach(() => {
      opbuf = new OperationBuffer(undefined, undefined, 5)
    })
    it('basic fill, calls bstadd', () => {
      const dummy = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [2, u1], [5, u1]),
        1,
        NodeType.DUMMY
      )
      dummy.value = 3

      const added_nodes: AnchorLogootNode[] = []
      const start = LogootPosition.fromIntsBranches(o, [-3, u1])
      const final_ranges = fillSkipRanges(
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1]),
        start,
        new LogootInt(4),
        NodeType.DATA,
        [dummy],
        opbuf,
        (n: AnchorLogootNode): void => { added_nodes.push(n) }
      )

      expect(opbuf.operations).to.be.deep.equal([
        { type: 'i', start: 3, offset: 0, length: 5}
      ])
      expect(final_ranges.length).to.be.equal(1)
      expect(added_nodes.length).to.be.equal(1)
      expect(final_ranges[0]).to.be.equal(added_nodes[0])
      expect(final_ranges[0].logoot_start.eq(start)).to.be.true
      expect(final_ranges[0].type).to.be.equal(NodeType.DATA)
      expect(final_ranges[0].clk.eq(4)).to.be.true
      expect(final_ranges[0].length).to.be.equal(5)
      expectAnchors(
        final_ranges[0],
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1])
      )
    })
    it('basic fill on lower level', () => {
      const dummy = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1], [5, u1]),
        1,
        NodeType.DUMMY
      )
      dummy.value = 3

      const added_nodes: AnchorLogootNode[] = []
      const start = LogootPosition.fromIntsBranches(o, [1, u1], [0, u1])
      const final_ranges = fillSkipRanges(
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1]),
        start,
        new LogootInt(4),
        NodeType.DATA,
        [dummy],
        opbuf,
        (n: AnchorLogootNode): void => { added_nodes.push(n) }
      )

      expect(opbuf.operations).to.be.deep.equal([
        { type: 'i', start: 3, offset: 0, length: 5}
      ])
      expect(final_ranges.length).to.be.equal(1)
      expect(added_nodes.length).to.be.equal(1)
      expect(final_ranges[0]).to.be.equal(added_nodes[0])
      expect(final_ranges[0].logoot_start.eq(start)).to.be.true
      expect(final_ranges[0].type).to.be.equal(NodeType.DATA)
      expect(final_ranges[0].clk.eq(4)).to.be.true
      expect(final_ranges[0].length).to.be.equal(5)
      expectAnchors(
        final_ranges[0],
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1])
      )
    })
    it('nested skipping fill', () => {
      const dummy = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [3, u1]),
        1,
        NodeType.DUMMY
      )
      dummy.value = 3
      opbuf.dummy_node = dummy
      const embedded = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [2, u1], [0, u1]),
        1,
        NodeType.DATA
      )
      embedded.value = 2

      const added_nodes: AnchorLogootNode[] = []
      const start = LogootPosition.fromIntsBranches(o, [0, u1])
      const final_ranges = fillSkipRanges(
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1]),
        start,
        new LogootInt(4),
        NodeType.DATA,
        [embedded, dummy],
        opbuf,
        (n: AnchorLogootNode): void => { added_nodes.push(n) }
      )

      expect(opbuf.operations).to.be.deep.equal([
        { type: 'i', start: 2, offset: 0, length: 2},
        { type: 'i', start: 5, offset: 2, length: 1}
      ])
      expect(final_ranges.length).to.be.equal(3)
      expect(added_nodes.length).to.be.equal(2)
      expect(final_ranges[0]).to.be.equal(added_nodes[0])
      expect(final_ranges[1]).to.be.equal(embedded)
      expect(final_ranges[2]).to.be.equal(added_nodes[1])

      expect(added_nodes[0].logoot_start.eq(start)).to.be.true
      expect(added_nodes[1].logoot_start.eq(start.offsetLowest(2))).to.be.true
      expectAnchors(
        added_nodes[0],
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [2, u1])
      )
      expectAnchors(
        added_nodes[1],
        LogootPosition.fromIntsBranches(o, [2, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1])
      )
    })
    it('overwrite fill', () => {
      const dummy = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [3, u1]),
        1,
        NodeType.DUMMY
      )
      dummy.value = 3
      opbuf.dummy_node = dummy
      const embedded = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1]),
        1,
        NodeType.DATA
      )
      embedded.left_anchor = DocStart
      embedded.right_anchor = DocEnd
      embedded.value = 2

      let root = embedded

      const added_nodes: AnchorLogootNode[] = []
      const start = LogootPosition.fromIntsBranches(o, [0, u1])
      const final_ranges = fillSkipRanges(
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1]),
        start,
        new LogootInt(4),
        NodeType.DATA,
        [embedded, dummy],
        opbuf,
        (n: AnchorLogootNode): void => {
          root.addChild(n, (n) => (root = n))
          added_nodes.push(n)
        }
      )

      expect(opbuf.operations).to.be.deep.equal([
        { type: 'i', start: 2, offset: 0, length: 1},
        { type: 'r', start: 3, length: 1},
        { type: 'i', start: 3, offset: 1, length: 1},
        { type: 'i', start: 4, offset: 2, length: 1}
      ])
      expect(final_ranges.length).to.be.equal(3)
      expect(added_nodes.length).to.be.equal(2)
      expect(final_ranges[0]).to.be.equal(added_nodes[0])
      expect(final_ranges[1]).to.be.equal(embedded)
      expect(final_ranges[2]).to.be.equal(added_nodes[1])

      expect(added_nodes[0].logoot_start.eq(start)).to.be.true
      expect(added_nodes[1].logoot_start.eq(start.offsetLowest(2))).to.be.true

      expectAnchors(
        final_ranges[0],
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [1, u1])
      )
      expectAnchors(
        final_ranges[1],
        LogootPosition.fromIntsBranches(o, [1, u1]),
        LogootPosition.fromIntsBranches(o, [2, u1])
      )
      expectAnchors(
        final_ranges[2],
        LogootPosition.fromIntsBranches(o, [2, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1])
      )
    })
    it('new node has priority', () => {
      const dummy = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [3, u1]),
        1,
        NodeType.DUMMY
      )
      dummy.value = 3
      opbuf.dummy_node = dummy
      const embedded = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [1, u1]),
        1,
        NodeType.DATA
      )
      embedded.value = 2

      let root = embedded

      const added_nodes: AnchorLogootNode[] = []
      const start = LogootPosition.fromIntsBranches(o, [0, u1])
      fillSkipRanges(
        LogootPosition.fromIntsBranches(o, [-10, u1]),
        LogootPosition.fromIntsBranches(o, [20, u1]),
        start,
        new LogootInt(0),
        NodeType.DATA,
        [embedded, dummy],
        opbuf,
        (n: AnchorLogootNode): void => {
          root.addChild(n, (n) => (root = n))
          added_nodes.push(n)
        }
      )

      expect(opbuf.operations).to.be.deep.equal([
        { type: 'i', start: 2, offset: 0, length: 1},
        { type: 'r', start: 3, length: 1},
        { type: 'i', start: 3, offset: 1, length: 1},
        { type: 'i', start: 4, offset: 2, length: 1}
      ])
    })
  })
  describe('linkFilledSkipRanges', () => {
    let nodes: AnchorLogootNode[]
    beforeEach(() => {
      nodes = [2,3,4]
        .map((n) => LogootPosition.fromIntsBranches(o, [n, u1]))
        .map((pos) => {
          const node = new AnchorLogootNode(pos, 1, NodeType.DATA)
          node.left_anchor = DocStart
          node.right_anchor = DocEnd
          return node
        })
    })
    it('basic linkage', () => {
      const p = (n: number): LogootPosition =>
        LogootPosition.fromIntsBranches(o, [n, u1])

      linkFilledSkipRanges(p(0), p(6), nodes, 1)
      
      const expectAnchorEqual = (
        pos: LeftAnchor | RightAnchor,
        to: LogootPosition
      ): void => {
        expect(pos).to.be.an.instanceOf(LogootPosition)
        expect((pos as LogootPosition).eq(to)).to.be.true
      }

      expectAnchorEqual(nodes[0].true_left, p(0))
      expectAnchorEqual(nodes[0].true_right, p(3))
      expectAnchorEqual(nodes[1].true_left, p(3))
      expectAnchorEqual(nodes[1].true_right, p(4))
      expectAnchorEqual(nodes[2].true_left, p(4))
      expectAnchorEqual(nodes[2].true_right, p(6))
    })
    it('should not link nodes on lower level', () => {
      const p = (n: number): LogootPosition =>
        LogootPosition.fromIntsBranches(o, [n, u1])

      const lower_node = new AnchorLogootNode(
        LogootPosition.fromIntsBranches(o, [3, u1], [0, u1]),
        1,
        NodeType.DATA
      )
      lower_node.left_anchor = DocStart
      lower_node.right_anchor = DocEnd
      nodes.splice(1, 0, lower_node)

      linkFilledSkipRanges(p(0), p(6), nodes, 1)
      
      const expectAnchorEqual = (
        pos: LeftAnchor | RightAnchor,
        to: LogootPosition
      ): void => {
        expect(pos).to.be.an.instanceOf(LogootPosition)
        expect((pos as LogootPosition).eq(to)).to.be.true
      }

      expectAnchorEqual(nodes[0].true_left, p(0))
      expectAnchorEqual(nodes[0].true_right, p(3))
      expect(nodes[1].true_left).to.be.equal(DocStart)
      expect(nodes[1].true_right).to.be.equal(DocEnd)
      expectAnchorEqual(nodes[2].true_left, p(3))
      expectAnchorEqual(nodes[2].true_right, p(4))
      expectAnchorEqual(nodes[3].true_left, p(4))
      expectAnchorEqual(nodes[3].true_right, p(6))
    })
  })
  describe('fillRangeConflicts', () => {
    // TODO
  })
})

describe('ListDocumentModel', () => {
  let o: BranchOrder
  let ldm: ListDocumentModel
  const u1 = 'U1'
  const u2 = 'U2'
  const u3 = 'U3'
  const p = (...ns: number[]): LogootPosition =>
    LogootPosition.fromIntsBranches(
      o,
      ...ns.map((n) => [n, u1]) as [number, string][]
    )
  beforeEach(() => {
    o = new BranchOrder()
    ldm = new ListDocumentModel(o)
    ldm.opts.agressively_test_bst = true
    o.i(u1)
    o.i(u2)
    o.i(u3)
  })
  describe('insertLocal', () => {
    it('should default to an `undefined` anchor', () => {
      const { left, right, clk, length } = ldm.insertLocal(0, 5)
      expect(left).to.be.undefined
      expect(right).to.be.undefined
      expect(clk.eq(0)).to.be.true
      expect(length).to.be.equal(5)
    })
    it('should make neighbors anchor nodes', () => {
      ldm.bst.add(new AnchorLogootNode(p(0), 2))
      ldm.bst.add(((): AnchorLogootNode => {
        const node = new AnchorLogootNode(p(20), 2)
        node.value = 2
        return node
      })())
      const { left, right, clk, length } = ldm.insertLocal(2, 5)
      expect(left.eq(p(2))).to.be.true
      expect(right.eq(p(20))).to.be.true
      expect(clk.eq(0)).to.be.true
      expect(length).to.be.equal(5)
    })
    it('should return correct position in middle of node', () => {
      ldm.bst.add(new AnchorLogootNode(p(0), 2))
      const { left, right, clk, length } = ldm.insertLocal(1, 5)
      expect(left.eq(p(1))).to.be.true
      expect(right.eq(p(1))).to.be.true
      expect(clk.eq(0)).to.be.true
      expect(length).to.be.equal(5)
    })
    it('should write over old removals', () => {
      ldm.bst.add(new AnchorLogootNode(
        p(0), 2, NodeType.REMOVAL, new LogootInt(4)
      ))
      ldm.bst.add(new AnchorLogootNode(
        p(5), 2, NodeType.REMOVAL, new LogootInt(3)
      ))
      const { left, right, clk, length } = ldm.insertLocal(1, 5)
      expect(left).to.be.undefined
      expect(right).to.be.undefined
      expect(clk.eq(5)).to.be.true
      expect(length).to.be.equal(5)
    })
  })
  describe('removeLocal', () => {
    let last_position: number
    beforeEach(() => {
      last_position = 0
    })
    const node = (
      pos: LogootPosition,
      len: number,
      clk: LogootInt | number = 0
    ): AnchorLogootNode => {
      const node = new AnchorLogootNode(pos, len)
      node.clk.assign(clk)
      if (ldm.max_clk.lt(clk)) {
        ldm.max_clk.assign(clk)
      }
      node.value = last_position
      last_position += len
      return node
    }
    it('should calculate start/end single removals', () => {
      ldm.bst.add(node(p(0), 5))
      const rm = ldm.removeLocal(1, 2)
      expect(rm.length).to.be.equal(1)
      expect(rm[0].start.eq(p(1))).to.be.true
      expect(rm[0].length).to.be.equal(2)
    })
    it('should condense removals', () => {
      ldm.bst.add(node(p(0), 1))
      ldm.bst.add(node(p(1, 0), 1))
      ldm.bst.add(node(p(1), 1))
      const rm = ldm.removeLocal(0, 3)
      expect(rm.length).to.be.equal(2)
      expect(rm[0].start.eq(p(0))).to.be.true
      expect(rm[0].length).to.be.equal(2)
      expect(rm[1].start.eq(p(1, 0))).to.be.true
      expect(rm[1].length).to.be.equal(1)
    })
    it('should default to max_clk', () => {
      ldm.bst.add(node(p(0), 1, 5))
      ldm.bst.add(node(p(1), 1, 1))
      const rm = ldm.removeLocal(1, 1)
      expect(rm.length).to.be.equal(1)
      expect(rm[0].clk.js_int).to.be.equal(5)
    })
    it('should increment the clock if necessary', () => {
      ldm.bst.add(node(p(0), 1, 5))
      ldm.bst.add(node(p(1), 1, 1))
      const rm = ldm.removeLocal(0, 2)
      expect(rm.length).to.be.equal(1)
      expect(rm[0].clk.js_int).to.be.equal(6)
    })
  })
  describe('insertLogoot', () => {
    afterEach('self-test', () => {
      ldm.selfTest()
    })
    describe('additions', () => {
      it('insertion to blank BST', () => {
        const ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          2,
          new LogootInt(5)
        )
        const exp_s = LogootPosition.fromIntsBranches(o, [0, u1])
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 2 }
        ])
        const nodes = ldm.all_nodes
        expect(nodes.length).to.be.equal(1)
        expect(nodes[0].logoot_start.cmp(exp_s)).to.be.equal(0)
        expect(nodes[0].length).to.be.equal(2)
        expect(nodes[0].clk.js_int).to.be.equal(5)
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
      })
      it('insertion to blank BST with right/left positions', () => {
        const ops = ldm.insertLogoot(
          u1,
          LogootPosition.fromIntsBranches(o, [1, u2]),
          LogootPosition.fromIntsBranches(o, [1, u2]),
          2,
          new LogootInt(5)
        )
        const nodes = ldm.all_nodes
        const exp_s = LogootPosition.fromIntsBranches(o, [1, u2], [0, u1])
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 2 }
        ])
        expect(nodes.length).to.be.equal(1)
        expect(nodes[0].logoot_start.cmp(exp_s)).to.be.equal(0)
        expect(nodes[0].length).to.be.equal(2)
        expect(nodes[0].clk.js_int).to.be.equal(5)
      })
      it('consecutive insertions', () => {
        let ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          2,
          new LogootInt(5)
        )
        let nodes = ldm.all_nodes
        let exp_s = LogootPosition.fromIntsBranches(o, [0, u1])
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 2 }
        ])
        expect(nodes.length).to.be.equal(1)
        expect(nodes[0].logoot_start.cmp(exp_s)).to.be.equal(0)
        expect(nodes[0].length).to.be.equal(2)
        expect(nodes[0].clk.js_int).to.be.equal(5)
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        ops = ldm.insertLogoot(
          u1,
          LogootPosition.fromIntsBranches(o, [2, u1]),
          undefined,
          1,
          new LogootInt(2)
        )
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 2, offset: 0, length: 1 }
        ])
      })
      it('consecutive backwards insertions with offset', () => {
        let ops = ldm.insertLogoot(
          u2,
          undefined,
          undefined,
          2,
          new LogootInt(5)
        )
        let nodes = ldm.all_nodes
        let exp_s = LogootPosition.fromIntsBranches(o, [0, u2])
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 2 }
        ])
        expect(nodes.length).to.be.equal(1)
        expect(nodes[0].logoot_start.cmp(exp_s)).to.be.equal(0)
        expect(nodes[0].length).to.be.equal(2)
        expect(nodes[0].clk.js_int).to.be.equal(5)
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        ops = ldm.insertLogoot(
          u1,
          undefined,
          LogootPosition.fromIntsBranches(o, [0, u2]),
          1,
          new LogootInt(2)
        )
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 1 }
        ])
      })
      it('insertion overwriting', () => {
        let ops = ldm.insertLogoot(
          u1,
          LogootPosition.fromIntsBranches(o, [1, u1]),
          undefined,
          1,
          new LogootInt(2)
        )
        let nodes = ldm.all_nodes
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 1 }
        ])
        ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          3,
          new LogootInt(5)
        )
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 1 },
          { type: 'r', start: 1, length: 1 },
          { type: 'i', start: 1, offset: 1, length: 1 },
          { type: 'i', start: 2, offset: 2, length: 1 }
        ])
      })
      it('insertion skipping', () => {
        let ops = ldm.insertLogoot(
          u1,
          LogootPosition.fromIntsBranches(o, [1, u1]),
          undefined,
          1,
          new LogootInt(5)
        )
        let nodes = ldm.all_nodes
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 1 }
        ])
        ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          3,
          new LogootInt(2)
        )
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 1 },
          { type: 'i', start: 2, offset: 2, length: 1 }
        ])
      })
      it('nested insertion skipping', () => {
        const pos = LogootPosition.fromIntsBranches(o, [1, u1])
        let ops = ldm.insertLogoot(u1, pos, pos, 1, new LogootInt(5))
        let nodes = ldm.all_nodes
        expect(nodes[0].logoot_start.eq(
          LogootPosition.fromIntsBranches(o, [1, u1], [0, u1])
        )).to.be.true
        expect(nodes[0].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[0].true_left as LogootPosition).eq(pos)).to.true
        expect(nodes[0].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[0].true_right as LogootPosition).eq(pos)).to.true
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 1 }
        ])
        ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          2,
          new LogootInt(2)
        )
        nodes = ldm.all_nodes
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 0, offset: 0, length: 1 },
          { type: 'i', start: 2, offset: 1, length: 1 }
        ])
        expectAnchors(
          nodes[1],
          LogootPosition.fromIntsBranches(o, [1, u1]),
          LogootPosition.fromIntsBranches(o, [1, u1])
        )
        expectAnchors(
          nodes[0],
          DocStart,
          LogootPosition.fromIntsBranches(o, [1, u1], [0, u1])
        )
        expectAnchors(
          nodes[2],
          LogootPosition.fromIntsBranches(o, [1, u1], [1, u1]),
          DocEnd
        )
      })
      it('insertion in middle', () => {
        ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          2,
          new LogootInt(0)
        )
        let ops = ldm.insertLogoot(
          u1,
          p(1),
          p(1),
          2,
          new LogootInt(2)
        )
        expect(ops).to.be.deep.equal([
          { type: 'i', start: 1, offset: 0, length: 2 }
        ])
        const nodes = ldm.all_nodes
        expect(nodes.length).to.be.equal(3)
      })
    })
    describe('conflicts', () => {
      it('new node reduces old anchor (end reduction)', () => {
        let ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          2,
          new LogootInt(5)
        )
        let nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        ops = ldm.insertLogoot(
          u1,
          LogootPosition.fromIntsBranches(o, [2, u1]),
          undefined,
          1,
          new LogootInt(2)
        )
        nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.an.instanceOf(LogootPosition)
        expect(
          (nodes[0].true_right as LogootPosition)
            .eq(LogootPosition.fromIntsBranches(o, [2, u1])),
          'First right wrong'
        ).to.be.true
        expect(nodes[1].true_left).to.be.an.instanceOf(LogootPosition)
        expect(
          (nodes[1].true_left as LogootPosition)
            .eq(LogootPosition.fromIntsBranches(o, [2, u1])),
          'Second left wrong'
        ).to.be.true
        expect(nodes[1].true_right).to.be.equal(DocEnd)
      })
      it('new node reduces old anchor (start reduction)', () => {
        let ops = ldm.insertLogoot(
          u2, // Unlike above, we have to impersonate a user to test this
          undefined,
          undefined,
          1,
          new LogootInt(2)
        )
        let nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        ops = ldm.insertLogoot(
          u1,
          undefined,
          LogootPosition.fromIntsBranches(o, [0, u2]),
          2,
          new LogootInt(5)
        )
        nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.an.instanceOf(LogootPosition)
        expect(
          (nodes[0].true_right as LogootPosition)
            .eq(LogootPosition.fromIntsBranches(o, [0, u2])),
          'First right wrong'
        ).to.be.true
        expect(nodes[1].true_left).to.be.an.instanceOf(LogootPosition)
        expect(
          (nodes[1].true_left as LogootPosition)
            .eq(LogootPosition.fromIntsBranches(o, [2, u1])),
          'Second left wrong'
        ).to.be.true
        expect(nodes[1].true_right).to.be.equal(DocEnd)
      })
      it('conflict creation', () => {
        let ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          1,
          new LogootInt(2)
        )
        let nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        ops = ldm.insertLogoot(
          u2,
          undefined,
          undefined,
          2,
          new LogootInt(5)
        )
        nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        expect(nodes[1].true_left).to.be.equal(DocStart)
        expect(nodes[1].true_right).to.be.equal(DocEnd)

        expect(nodes[1].conflict_with).to.include(nodes[0])
        expect(nodes[0].conflict_with).to.include(nodes[1])
      })
      it('conflict creation, reverse order', () => {
        let ops = ldm.insertLogoot(
          u2,
          undefined,
          undefined,
          1,
          new LogootInt(2)
        )
        let nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          2,
          new LogootInt(5)
        )
        nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        expect(nodes[1].true_left).to.be.equal(DocStart)
        expect(nodes[1].true_right).to.be.equal(DocEnd)

        expect(nodes[1].conflict_with).to.include(nodes[0])
        expect(nodes[0].conflict_with).to.include(nodes[1])
      })
      it('adds conflict to possibly many nodes', () => {
        const nodes = [0,1,2].map((i) => {
          const node = new AnchorLogootNode(p(5 + i), 1)
          node.value = i
          ldm.bst.add(node)
          return node
        })
        nodes[0].left_anchor = DocStart
        nodes[2].right_anchor = DocEnd
        ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          1,
          new LogootInt(0)
        )
        expect(ldm.all_nodes.length).to.be.equal(1 + nodes.length)
        const newnode = ldm.all_nodes[0]
        expect(newnode.conflict_with).to.include(nodes[0])
        nodes.forEach((node) => {
          expect(node.conflict_with).to.include(newnode)
        })
        expect(newnode.ldoc_start).to.be.equal(0)
        expect(nodes[0].ldoc_start).to.be.equal(1)
        expect(nodes[1].ldoc_start).to.be.equal(2)
        expect(nodes[2].ldoc_start).to.be.equal(3)
      })
      it('splits destination node to make conflicts work', () => {
        const cnode = new AnchorLogootNode(p(5), 5)
        ldm.bst.add(cnode)
        cnode.left_anchor = DocStart
        cnode.right_anchor = DocEnd

        ldm.insertLogoot(
          u1,
          p(0),
          p(6),
          1,
          new LogootInt(0)
        )

        const newnode = ldm.all_nodes[0]
        const ncnode = cnode.inorder_successor
        expect(cnode.length).to.be.equal(1)
        expect(ncnode).to.not.be.undefined
        expect(ncnode.length).to.be.equal(4)
        expect(newnode.conflict_with).to.include(cnode)
        expect(newnode.conflict_with).to.not.include(ncnode)
        expect(cnode.conflict_with).to.include(newnode)
        expect(ncnode.conflict_with).to.not.include(newnode)
      })
      it('retroactive reductions', () => {
        const pos = LogootPosition.fromIntsBranches(o, [2, u1])
        let ops = ldm.insertLogoot(
          u1,
          pos,
          undefined,
          2,
          new LogootInt(2)
        )
        let nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[0].true_left as LogootPosition).eq(pos)).to.be.true
        expect(nodes[0].true_right).to.be.equal(DocEnd)
        ops = ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          2,
          new LogootInt(2)
        )
        nodes = ldm.all_nodes
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[0].true_right as LogootPosition).eq(pos)).to.be.true
        expect(nodes[1].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[1].true_left as LogootPosition).eq(pos)).to.be.true
        expect(nodes[1].true_right).to.be.equal(DocEnd)
      })
      it('does not reduce if removal anchors to start', () => {
        const cnode = new AnchorLogootNode(p(3), 1, NodeType.REMOVAL)
        ldm.bst.add(cnode)
        cnode.left_anchor = p(1)
        cnode.right_anchor = DocEnd

        ldm.insertLogoot(
          u1,
          undefined,
          undefined,
          1,
          new LogootInt(0)
        )

        const newnode = ldm.all_nodes[0]

        expectAnchors(newnode, DocStart, DocEnd)
        expectAnchors(cnode, p(1), DocEnd)
        expect(cnode.conflict_with).to.include(newnode)
        expect(newnode.conflict_with).to.not.include(cnode)
      })
      it('if anchored to removal, replaces anchor', () => {
        const cnode = new AnchorLogootNode(p(3), 1, NodeType.REMOVAL)
        ldm.bst.add(cnode)
        cnode.left_anchor = p(1)
        cnode.right_anchor = p(4)
        const cnode2 = new AnchorLogootNode(p(4), 1, NodeType.REMOVAL)
        ldm.bst.add(cnode2)
        cnode2.left_anchor = p(4)
        cnode2.right_anchor = p(20)

        ldm.insertLogoot(
          u1,
          p(0),
          p(3),
          1,
          new LogootInt(0)
        )

        const newnode = ldm.all_nodes[0]

        expectAnchors(newnode, p(0), p(20))
        expectAnchors(cnode, p(1), p(4))
        expectAnchors(cnode2, p(4), p(20))
        expect(cnode.conflict_with).to.include(newnode)
        expect(newnode.conflict_with).to.not.include(cnode)
        expect(newnode.conflict_with).to.not.include(cnode2)
      })
      it('removal skipping reduces node anchor', () => {
        const cnode = new AnchorLogootNode(p(3), 1, NodeType.REMOVAL)
        ldm.bst.add(cnode)
        cnode.left_anchor = p(1)
        cnode.right_anchor = p(4)
        const cnode2 = new AnchorLogootNode(p(4), 1, NodeType.DATA)
        ldm.bst.add(cnode2)
        cnode2.left_anchor = DocStart
        cnode2.right_anchor = p(20)

        ldm.insertLogoot(
          u1,
          p(0),
          p(3),
          1,
          new LogootInt(0)
        )

        const newnode = ldm.all_nodes[0]

        expectAnchors(newnode, p(0), p(4))
        expectAnchors(cnode, p(1), p(4))
        expectAnchors(cnode2, p(1), p(20))
        expect(cnode.conflict_with).to.include(newnode)
        expect(newnode.conflict_with).to.not.include(cnode)
        expect(newnode.conflict_with).to.not.include(cnode2)
      })
    })
  })
  describe('removeLogoot', () => {
    afterEach('self-test', () => {
      ldm.selfTest()
    })
    describe('removals', () => {
      it('basic removal', () => {
        const n = new AnchorLogootNode(p(0), 1)
        n.left_anchor = DocStart
        n.right_anchor = DocEnd
        ldm.bst.add(n)

        ldm.removeLogoot(p(0), 1, new LogootInt(0))

        const nodes = ldm.all_nodes
        expect(nodes.length).to.be.equal(1)
        expect(nodes[0].type).to.be.equal(NodeType.REMOVAL)
        expect(nodes[0].logoot_start.eq(p(0))).to.be.true
        expect(nodes[0].length).to.be.equal(1)
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.equal(DocEnd)
      })
      it('removal from sequence', () => {
        const nodes = ([0,1,2]).map((i) => {
          const n = new AnchorLogootNode(p(i), 1)
          n.value = i
          return n
        })
        nodes[0].left_anchor = DocStart
        nodes[2].right_anchor = DocEnd
        nodes.forEach((n) => ldm.bst.add(n))

        ldm.removeLogoot(p(1), 1, new LogootInt(0))

        expect(nodes[0].type).to.be.equal(NodeType.DATA)
        expect(nodes[0].logoot_start.eq(p(0))).to.be.true
        expect(nodes[0].length).to.be.equal(1)
        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[0].true_right as LogootPosition).eq(p(2))).to.be.true

        expect(nodes[1].type).to.be.equal(NodeType.REMOVAL)
        expect(nodes[1].logoot_start.eq(p(1))).to.be.true
        expect(nodes[1].length).to.be.equal(1)
        expect(nodes[1].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[1].true_left as LogootPosition).eq(p(1))).to.be.true
        expect(nodes[1].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[1].true_right as LogootPosition).eq(p(2))).to.be.true

        expect(nodes[2].type).to.be.equal(NodeType.DATA)
        expect(nodes[2].logoot_start.eq(p(2))).to.be.true
        expect(nodes[2].length).to.be.equal(1)
        expect(nodes[2].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[2].true_left as LogootPosition).eq(p(1))).to.be.true
        expect(nodes[2].true_right).to.be.equal(DocEnd)
      })
      it('removal from sequence with surrounding removals', () => {
        const nodes = ([0,1,2,3,4]).map((i) => {
          const n = new AnchorLogootNode(p(i), 1)
          n.value = i
          return n
        })
        nodes[0].left_anchor = DocStart
        nodes[4].right_anchor = DocEnd
        nodes.forEach((n) => ldm.bst.add(n))

        ldm.removeLogoot(p(1), 1, new LogootInt(0))
        ldm.removeLogoot(p(3), 1, new LogootInt(0))
        ldm.removeLogoot(p(2), 1, new LogootInt(0))

        expect(nodes[0].true_left).to.be.equal(DocStart)
        expect(nodes[0].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[0].true_right as LogootPosition).eq(p(4))).to.be.true

        expect(nodes[1].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[1].true_left as LogootPosition).eq(p(1))).to.be.true
        expect(nodes[1].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[1].true_right as LogootPosition).eq(p(2))).to.be.true

        expect(nodes[2].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[2].true_left as LogootPosition).eq(p(2))).to.be.true
        expect(nodes[2].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[2].true_right as LogootPosition).eq(p(3))).to.be.true

        expect(nodes[3].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[3].true_left as LogootPosition).eq(p(3))).to.be.true
        expect(nodes[3].true_right).to.be.an.instanceOf(LogootPosition)
        expect((nodes[3].true_right as LogootPosition).eq(p(4))).to.be.true

        expect(nodes[4].true_left).to.be.an.instanceOf(LogootPosition)
        expect((nodes[4].true_left as LogootPosition).eq(p(1))).to.be.true
        expect(nodes[4].true_right).to.be.equal(DocEnd)
      })
      it('removal from sequence with multiple surrounding removals', () => {
        const nodes = ([0,1,2,3,4,5]).map((i) => {
          const n = new AnchorLogootNode(p(i), 1)
          n.value = i
          return n
        })
        nodes[0].left_anchor = DocStart
        nodes[5].right_anchor = DocEnd
        nodes.forEach((n) => ldm.bst.add(n))

        ldm.removeLogoot(p(1), 1, new LogootInt(0))
        ldm.selfTest()
        ldm.removeLogoot(p(2), 1, new LogootInt(0))
        ldm.selfTest()
        ldm.removeLogoot(p(3), 1, new LogootInt(0))
        ldm.selfTest()
        ldm.removeLogoot(p(4), 1, new LogootInt(0))
        ldm.selfTest()
      })
      it('consecutive removal anchor replacement', () => {
        ldm.insertLogoot(u1, undefined, undefined, 1, new LogootInt(0))
        ldm.insertLogoot(
          u3,
          LogootPosition.fromIntsBranches(o, [1, u1]),
          undefined,
          3,
          new LogootInt(0)
        )
        ldm.insertLogoot(
          u2,
          LogootPosition.fromIntsBranches(o, [1, u1]),
          LogootPosition.fromIntsBranches(o, [0, u3]),
          2,
          new LogootInt(0)
        )
        ldm.removeLogoot(
          LogootPosition.fromIntsBranches(o, [0, u3]),
          1,
          new LogootInt(0)
        )
        ldm.removeLogoot(
          LogootPosition.fromIntsBranches(o, [0, u2]),
          2,
          new LogootInt(0)
        )
        const nodes = ldm.all_nodes
        expectAnchors(
          nodes[0],
          DocStart,
          LogootPosition.fromIntsBranches(o, [1, u3])
        )
        expectAnchors(
          nodes[1],
          LogootPosition.fromIntsBranches(o, [1, u1]),
          LogootPosition.fromIntsBranches(o, [0, u3])
        )
        expectAnchors(
          nodes[2],
          LogootPosition.fromIntsBranches(o, [2, u2]),
          LogootPosition.fromIntsBranches(o, [1, u3])
        )
        expectAnchors(
          nodes[3],
          LogootPosition.fromIntsBranches(o, [1, u1]),
          DocEnd
        )
      })
    })
  })
})
