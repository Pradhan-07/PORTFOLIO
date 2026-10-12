import React, { useState, useEffect, useRef, useCallback } from 'react';

type AlgorithmType = 'binary-search' | 'bubble-sort' | 'selection-sort' | 'linked-list' | 'tree-traversal';

interface StepLog {
  step: number;
  message: string;
  codeLine?: string;
}

export const DSAVisualizer: React.FC = () => {
  const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmType>('binary-search');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(800); // ms per step
  const [logs, setLogs] = useState<StepLog[]>([]);

  // ---------------------------------------------------------------------------
  // 1. Binary Search State
  // ---------------------------------------------------------------------------
  const [bsArray] = useState<number[]>([4, 9, 15, 23, 31, 42, 56, 68, 77, 89, 95]);
  const [bsTarget, setBsTarget] = useState<number>(42);
  const [bsLow, setBsLow] = useState<number>(0);
  const [bsHigh, setBsHigh] = useState<number>(10);
  const [bsMid, setBsMid] = useState<number | null>(null);
  const [bsFound, setBsFound] = useState<boolean | null>(null);

  // ---------------------------------------------------------------------------
  // 2. Bubble Sort State
  // ---------------------------------------------------------------------------
  const [sortArray, setSortArray] = useState<number[]>([48, 12, 75, 33, 90, 24, 61, 18]);
  const [bubbleI, setBubbleI] = useState<number>(0);
  const [bubbleJ, setBubbleJ] = useState<number>(0);
  const [bubbleSorted, setBubbleSorted] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 3. Selection Sort State
  // ---------------------------------------------------------------------------
  const [selI, setSelI] = useState<number>(0);
  const [selJ, setSelJ] = useState<number>(1);
  const [selMinIdx, setSelMinIdx] = useState<number>(0);
  const [selSorted, setSelSorted] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 4. Linked List State
  // ---------------------------------------------------------------------------
  interface ListNode {
    id: string;
    val: number;
    highlight?: boolean;
    isNew?: boolean;
    isDeleting?: boolean;
  }
  const [listNodes, setListNodes] = useState<ListNode[]>([
    { id: '1', val: 12 },
    { id: '2', val: 28 },
    { id: '3', val: 45 },
    { id: '4', val: 67 },
  ]);

  // ---------------------------------------------------------------------------
  // 5. Binary Tree Traversal State
  // ---------------------------------------------------------------------------
  type TraversalType = 'inorder' | 'preorder' | 'postorder';
  const [traversalType, setTraversalType] = useState<TraversalType>('inorder');
  const [treeActiveNode, setTreeActiveNode] = useState<number | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<number[]>([]);
  const [treeStepIdx, setTreeStepIdx] = useState<number>(0);

  const timerRef = useRef<number | null>(null);

  // Tree nodes definition
  const treeOrderMap: Record<TraversalType, number[]> = {
    inorder: [10, 20, 30, 40, 50, 60, 70],
    preorder: [40, 20, 10, 30, 60, 50, 70],
    postorder: [10, 30, 20, 50, 70, 60, 40],
  };

  // Reset current algorithm state
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) window.clearInterval(timerRef.current);

    if (activeAlgorithm === 'binary-search') {
      setBsLow(0);
      setBsHigh(bsArray.length - 1);
      setBsMid(null);
      setBsFound(null);
      setLogs([{ step: 0, message: `Initialized Binary Search. Target = ${bsTarget}, Range = [0, ${bsArray.length - 1}]` }]);
    } else if (activeAlgorithm === 'bubble-sort') {
      setSortArray([48, 12, 75, 33, 90, 24, 61, 18]);
      setBubbleI(0);
      setBubbleJ(0);
      setBubbleSorted(false);
      setLogs([{ step: 0, message: 'Initialized Bubble Sort with unsorted array.' }]);
    } else if (activeAlgorithm === 'selection-sort') {
      setSortArray([64, 25, 12, 22, 11, 45, 88, 30]);
      setSelI(0);
      setSelJ(1);
      setSelMinIdx(0);
      setSelSorted(false);
      setLogs([{ step: 0, message: 'Initialized Selection Sort. Outer pointer i = 0.' }]);
    } else if (activeAlgorithm === 'linked-list') {
      setListNodes([
        { id: '1', val: 12 },
        { id: '2', val: 28 },
        { id: '3', val: 45 },
        { id: '4', val: 67 },
      ]);
      setLogs([{ step: 0, message: 'Linked list initialized with 4 nodes: 12 -> 28 -> 45 -> 67 -> NULL' }]);
    } else if (activeAlgorithm === 'tree-traversal') {
      setTreeActiveNode(null);
      setVisitedNodes([]);
      setTreeStepIdx(0);
      setLogs([{ step: 0, message: `Ready to traverse binary tree using ${traversalType.toUpperCase()} order.` }]);
    }
  }, [activeAlgorithm, bsArray.length, bsTarget, traversalType]);

  useEffect(() => {
    handleReset();
  }, [activeAlgorithm, handleReset]);

  // Step function for Binary Search
  const stepBinarySearch = useCallback(() => {
    if (bsFound !== null) {
      setIsPlaying(false);
      return;
    }

    if (bsLow > bsHigh) {
      setBsFound(false);
      setLogs((prev) => [
        ...prev,
        { step: prev.length + 1, message: `low (${bsLow}) > high (${bsHigh}). Target ${bsTarget} was NOT found in the array!` },
      ]);
      setIsPlaying(false);
      return;
    }

    const mid = Math.floor((bsLow + bsHigh) / 2);
    setBsMid(mid);
    const midVal = bsArray[mid];

    if (midVal === bsTarget) {
      setBsFound(true);
      setLogs((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          message: `Target ${bsTarget} found at index ${mid}! (arr[${mid}] == ${bsTarget}). Search concluded in O(log N).`,
          codeLine: 'return mid;',
        },
      ]);
      setIsPlaying(false);
    } else if (midVal < bsTarget) {
      setBsLow(mid + 1);
      setLogs((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          message: `arr[${mid}] (${midVal}) < target (${bsTarget}) -> Discard left half. Set low = mid + 1 (${mid + 1}).`,
          codeLine: 'low = mid + 1;',
        },
      ]);
    } else {
      setBsHigh(mid - 1);
      setLogs((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          message: `arr[${mid}] (${midVal}) > target (${bsTarget}) -> Discard right half. Set high = mid - 1 (${mid - 1}).`,
          codeLine: 'high = mid - 1;',
        },
      ]);
    }
  }, [bsArray, bsFound, bsHigh, bsLow, bsTarget]);

  // Step function for Bubble Sort
  const stepBubbleSort = useCallback(() => {
    if (bubbleSorted) {
      setIsPlaying(false);
      return;
    }

    const n = sortArray.length;
    let nextI = bubbleI;
    let nextJ = bubbleJ;
    const newArr = [...sortArray];

    if (nextI < n - 1) {
      if (nextJ < n - nextI - 1) {
        if (newArr[nextJ] > newArr[nextJ + 1]) {
          const temp = newArr[nextJ];
          newArr[nextJ] = newArr[nextJ + 1];
          newArr[nextJ + 1] = temp;
          setLogs((prev) => [
            ...prev,
            { step: prev.length + 1, message: `Swapped arr[${nextJ}] (${temp}) with arr[${nextJ + 1}] (${newArr[nextJ]})` },
          ]);
        }
        nextJ++;
        if (nextJ >= n - nextI - 1) {
          nextJ = 0;
          nextI++;
          setLogs((prev) => [
            ...prev,
            { step: prev.length + 1, message: `Pass ${nextI} complete. Largest element placed at index ${n - nextI}.` },
          ]);
        }
      }
    } else {
      setBubbleSorted(true);
      setIsPlaying(false);
      setLogs((prev) => [...prev, { step: prev.length + 1, message: 'Array is fully sorted! Bubble Sort complete.' }]);
      return;
    }

    setSortArray(newArr);
    setBubbleI(nextI);
    setBubbleJ(nextJ);
  }, [bubbleI, bubbleJ, bubbleSorted, sortArray]);

  // Step function for Selection Sort
  const stepSelectionSort = useCallback(() => {
    if (selSorted) {
      setIsPlaying(false);
      return;
    }

    const n = sortArray.length;
    let i = selI;
    let j = selJ;
    let minIdx = selMinIdx;
    const arr = [...sortArray];

    if (i < n - 1) {
      if (j < n) {
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          setLogs((prev) => [
            ...prev,
            { step: prev.length + 1, message: `New minimum found: arr[${j}] = ${arr[j]}` },
          ]);
        }
        j++;
      } else {
        // Swap minIdx with i
        if (minIdx !== i) {
          const temp = arr[i];
          arr[i] = arr[minIdx];
          arr[minIdx] = temp;
          setLogs((prev) => [
            ...prev,
            { step: prev.length + 1, message: `Swapped minimum element arr[${minIdx}] (${arr[i]}) with arr[${i}] (${temp}).` },
          ]);
        }
        i++;
        minIdx = i;
        j = i + 1;
      }
    } else {
      setSelSorted(true);
      setIsPlaying(false);
      setLogs((prev) => [...prev, { step: prev.length + 1, message: 'Selection Sort completed successfully!' }]);
      return;
    }

    setSortArray(arr);
    setSelI(i);
    setSelJ(j);
    setSelMinIdx(minIdx);
  }, [selI, selJ, selMinIdx, selSorted, sortArray]);

  // Step function for Tree Traversal
  const stepTreeTraversal = useCallback(() => {
    const sequence = treeOrderMap[traversalType];
    if (treeStepIdx >= sequence.length) {
      setIsPlaying(false);
      setLogs((prev) => [
        ...prev,
        { step: prev.length + 1, message: `${traversalType.toUpperCase()} traversal complete! Order: [${sequence.join(', ')}]` },
      ]);
      return;
    }

    const currentNode = sequence[treeStepIdx];
    setTreeActiveNode(currentNode);
    setVisitedNodes((prev) => [...prev, currentNode]);
    setTreeStepIdx((prev) => prev + 1);

    setLogs((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        message: `Visiting Node ${currentNode} (Step ${treeStepIdx + 1} of ${sequence.length}) in ${traversalType.toUpperCase()} order`,
      },
    ]);
  }, [treeOrderMap, treeStepIdx, traversalType]);

  // Master Step Router
  const handleSingleStep = useCallback(() => {
    if (activeAlgorithm === 'binary-search') stepBinarySearch();
    else if (activeAlgorithm === 'bubble-sort') stepBubbleSort();
    else if (activeAlgorithm === 'selection-sort') stepSelectionSort();
    else if (activeAlgorithm === 'tree-traversal') stepTreeTraversal();
  }, [activeAlgorithm, stepBinarySearch, stepBubbleSort, stepSelectionSort, stepTreeTraversal]);

  // Play / Auto-tick timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        handleSingleStep();
      }, speed);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, handleSingleStep]);

  // Linked list operations
  const insertLinkedListHead = () => {
    const val = Math.floor(Math.random() * 80) + 10;
    const newNode: ListNode = { id: Date.now().toString(), val, isNew: true };
    setListNodes((prev) => [newNode, ...prev]);
    setLogs((prev) => [
      ...prev,
      { step: prev.length + 1, message: `Inserted node ${val} at HEAD. newNode->next = head; head = newNode;` },
    ]);
  };

  const insertLinkedListTail = () => {
    const val = Math.floor(Math.random() * 80) + 10;
    const newNode: ListNode = { id: Date.now().toString(), val, isNew: true };
    setListNodes((prev) => [...prev, newNode]);
    setLogs((prev) => [
      ...prev,
      { step: prev.length + 1, message: `Inserted node ${val} at TAIL. tail->next = newNode; newNode->next = nullptr;` },
    ]);
  };

  const deleteLinkedListHead = () => {
    if (listNodes.length === 0) return;
    const deletedVal = listNodes[0].val;
    setListNodes((prev) => prev.slice(1));
    setLogs((prev) => [
      ...prev,
      { step: prev.length + 1, message: `Deleted node ${deletedVal} from HEAD. Node* temp = head; head = head->next; delete temp;` },
    ]);
  };

  return (
    <section
      id="dsa-playground"
      className="dsa-playground-section"
      style={{
        padding: '72px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
        position: 'relative',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <div className="section-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Header */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--dim)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            // 03 · ALGORITHMIC PLAYGROUND (C++ DSA)
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
              fontWeight: 400,
              color: 'var(--fg)',
              letterSpacing: '-0.02em',
            }}
          >
            Algorithmic <span style={{ fontStyle: 'italic', color: 'var(--chrome)' }}>thinking in motion.</span>
          </h2>
          <p
            style={{
              margin: '8px 0 0 0',
              fontFamily: '"Archivo", sans-serif',
              fontSize: '15px',
              color: 'var(--dim)',
              maxWidth: '680px',
              lineHeight: 1.6,
            }}
          >
            Interactive step-by-step simulations demonstrating asymptotic efficiency, pointer bounds, and node structures as studied in C++ DSA.
          </p>
        </div>

        {/* Algorithm Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            fontSize: '11px',
          }}
        >
          {[
            { id: 'binary-search', label: 'Binary Search O(log N)' },
            { id: 'bubble-sort', label: 'Bubble Sort O(N²)' },
            { id: 'selection-sort', label: 'Selection Sort O(N²)' },
            { id: 'linked-list', label: 'Linked List Pointers' },
            { id: 'tree-traversal', label: 'Binary Tree Traversal' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveAlgorithm(item.id as AlgorithmType)}
              style={{
                background: activeAlgorithm === item.id ? 'var(--fg)' : 'var(--line)',
                color: activeAlgorithm === item.id ? 'var(--bg)' : 'var(--chrome)',
                border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                borderRadius: '2px',
                padding: '6px 12px',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                fontWeight: 500,
                transition: 'all 180ms ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Canvas / Playground Panel */}
        <div
          style={{
            background: 'var(--line)',
            border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
            borderRadius: '4px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
              paddingBottom: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeAlgorithm !== 'linked-list' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                      background: isPlaying ? '#ffbd2e' : 'var(--fg)',
                      color: 'var(--bg)',
                      border: 'none',
                      borderRadius: '2px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {isPlaying ? '⏸ PAUSE' : '▶ START'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSingleStep}
                    disabled={isPlaying}
                    style={{
                      background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                      color: 'var(--fg)',
                      border: '1px solid color-mix(in srgb, var(--fg) 15%, transparent)',
                      borderRadius: '2px',
                      padding: '6px 12px',
                      cursor: isPlaying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    STEP ⏭
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'transparent',
                  color: 'var(--dim)',
                  border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                  borderRadius: '2px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                ↻ RESET
              </button>
            </div>

            {/* Algorithm-Specific Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {activeAlgorithm === 'binary-search' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--dim)' }}>Target:</span>
                  <input
                    type="number"
                    value={bsTarget}
                    onChange={(e) => {
                      setBsTarget(Number(e.target.value));
                      handleReset();
                    }}
                    style={{
                      width: '60px',
                      background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                      color: 'var(--fg)',
                      padding: '4px 6px',
                      fontSize: '11px',
                      borderRadius: '2px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              )}

              {activeAlgorithm === 'tree-traversal' && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['inorder', 'preorder', 'postorder'] as TraversalType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTraversalType(t);
                        handleReset();
                      }}
                      style={{
                        background: traversalType === t ? 'var(--accent)' : 'transparent',
                        color: traversalType === t ? 'var(--bg)' : 'var(--chrome)',
                        border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                        borderRadius: '2px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {activeAlgorithm === 'linked-list' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={insertLinkedListHead}
                    style={{
                      background: 'var(--fg)',
                      color: 'var(--bg)',
                      border: 'none',
                      borderRadius: '2px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    + INSERT HEAD
                  </button>
                  <button
                    type="button"
                    onClick={insertLinkedListTail}
                    style={{
                      background: 'color-mix(in srgb, var(--bg) 60%, transparent)',
                      color: 'var(--fg)',
                      border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                      borderRadius: '2px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    + INSERT TAIL
                  </button>
                  <button
                    type="button"
                    onClick={deleteLinkedListHead}
                    style={{
                      background: 'color-mix(in srgb, #ef4444 15%, transparent)',
                      color: '#ef4444',
                      border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)',
                      borderRadius: '2px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    - DELETE HEAD
                  </button>
                </div>
              )}

              {/* Speed Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--dim)', fontSize: '10px' }}>SPEED:</span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  style={{
                    background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)',
                    color: 'var(--chrome)',
                    padding: '3px 6px',
                    fontSize: '10px',
                    borderRadius: '2px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value={1400}>0.5x Slow</option>
                  <option value={800}>1.0x Normal</option>
                  <option value={350}>2.0x Fast</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visualization Stage */}
          <div
            style={{
              minHeight: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 8px',
              background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
              borderRadius: '3px',
              border: '1px solid color-mix(in srgb, var(--fg) 6%, transparent)',
              marginBottom: '20px',
              overflowX: 'auto',
            }}
          >
            {/* 1. BINARY SEARCH RENDER */}
            {activeAlgorithm === 'binary-search' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {bsArray.map((val, idx) => {
                    const isMid = bsMid === idx;
                    const isLow = bsLow === idx;
                    const isHigh = bsHigh === idx;
                    const isOutRange = idx < bsLow || idx > bsHigh;
                    const isFound = bsFound && isMid;

                    let borderColor = 'color-mix(in srgb, var(--fg) 15%, transparent)';
                    let bgColor = 'color-mix(in srgb, var(--line) 80%, transparent)';

                    if (isFound) {
                      borderColor = '#66cc6a';
                      bgColor = 'color-mix(in srgb, #66cc6a 20%, transparent)';
                    } else if (isMid) {
                      borderColor = 'var(--accent)';
                      bgColor = 'color-mix(in srgb, var(--accent) 25%, transparent)';
                    } else if (isOutRange) {
                      bgColor = 'color-mix(in srgb, var(--bg) 95%, transparent)';
                    }

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '46px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: bgColor,
                            border: `1.5px solid ${borderColor}`,
                            borderRadius: '3px',
                            color: isOutRange ? 'var(--dim)' : 'var(--fg)',
                            fontWeight: isMid ? 700 : 500,
                            fontSize: '14px',
                            opacity: isOutRange ? 0.35 : 1,
                            transition: 'all 200ms ease',
                          }}
                        >
                          {val}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--dim)' }}>[{idx}]</div>
                        <div style={{ height: '14px', fontSize: '9px', fontWeight: 600 }}>
                          {isMid && <span style={{ color: 'var(--accent)' }}>MID</span>}
                          {isLow && !isMid && <span style={{ color: '#ffbd2e' }}>LOW</span>}
                          {isHigh && !isMid && <span style={{ color: '#60a5fa' }}>HIGH</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--chrome)' }}>
                  Active Range: [{bsLow}, {bsHigh}] · Mid Element:{' '}
                  {bsMid !== null ? `${bsArray[bsMid]} (at idx ${bsMid})` : '—'} · Status:{' '}
                  {bsFound === true ? (
                    <span style={{ color: '#66cc6a', fontWeight: 600 }}>TARGET FOUND ✔</span>
                  ) : bsFound === false ? (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>NOT IN ARRAY ✖</span>
                  ) : (
                    <span style={{ color: 'var(--accent)' }}>SEARCHING...</span>
                  )}
                </div>
              </div>
            )}

            {/* 2 & 3. SORTING ALGORITHMS RENDER */}
            {(activeAlgorithm === 'bubble-sort' || activeAlgorithm === 'selection-sort') && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', paddingBottom: '10px' }}>
                  {sortArray.map((val, idx) => {
                    const isBubbleCompare = activeAlgorithm === 'bubble-sort' && (idx === bubbleJ || idx === bubbleJ + 1);
                    const isSelectionMin = activeAlgorithm === 'selection-sort' && idx === selMinIdx;
                    const isSelectionCurrent = activeAlgorithm === 'selection-sort' && idx === selJ;
                    const isSelectionSorted = activeAlgorithm === 'selection-sort' && idx < selI;

                    let barColor = 'var(--line)';
                    if (isBubbleCompare || isSelectionCurrent) barColor = 'var(--accent)';
                    if (isSelectionMin) barColor = '#ffbd2e';
                    if (isSelectionSorted || bubbleSorted) barColor = '#66cc6a';

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--dim)' }}>{val}</span>
                        <div
                          style={{
                            width: '32px',
                            height: `${val * 1.5}px`,
                            background: barColor,
                            borderRadius: '2px',
                            border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                            transition: 'height 180ms ease, background 180ms ease',
                          }}
                        />
                        <span style={{ fontSize: '9px', color: 'var(--dim)' }}>[{idx}]</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. LINKED LIST RENDER */}
            {activeAlgorithm === 'linked-list' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ padding: '6px 10px', background: 'var(--bg)', borderRadius: '2px', fontSize: '11px', color: 'var(--dim)' }}>
                  HEAD &gt;
                </div>
                {listNodes.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'color-mix(in srgb, var(--bg) 90%, #151815)',
                        border: '1px solid color-mix(in srgb, var(--fg) 20%, transparent)',
                        borderRadius: '3px',
                        padding: '8px 12px',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>{node.val}</div>
                      <div style={{ fontSize: '8.5px', color: 'var(--dim)', borderTop: '1px solid #222', paddingTop: '2px', marginTop: '4px' }}>
                        *next
                      </div>
                    </div>
                    {idx < listNodes.length - 1 ? (
                      <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>──&gt;</span>
                    ) : (
                      <span style={{ color: 'var(--dim)', fontSize: '14px', fontWeight: 700 }}>──&gt; NULL</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* 5. BINARY TREE TRAVERSAL RENDER */}
            {activeAlgorithm === 'tree-traversal' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {/* Visual Tree Levels */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  {/* Level 0: Root 40 */}
                  <TreeNode value={40} active={treeActiveNode === 40} visited={visitedNodes.includes(40)} />

                  {/* Level 1: 20 and 60 */}
                  <div style={{ display: 'flex', gap: '100px' }}>
                    <TreeNode value={20} active={treeActiveNode === 20} visited={visitedNodes.includes(20)} />
                    <TreeNode value={60} active={treeActiveNode === 60} visited={visitedNodes.includes(60)} />
                  </div>

                  {/* Level 2: 10, 30, 50, 70 */}
                  <div style={{ display: 'flex', gap: '36px' }}>
                    <TreeNode value={10} active={treeActiveNode === 10} visited={visitedNodes.includes(10)} />
                    <TreeNode value={30} active={treeActiveNode === 30} visited={visitedNodes.includes(30)} />
                    <TreeNode value={50} active={treeActiveNode === 50} visited={visitedNodes.includes(50)} />
                    <TreeNode value={70} active={treeActiveNode === 70} visited={visitedNodes.includes(70)} />
                  </div>
                </div>

                {/* Traversal Output Sequence */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--dim)' }}>Accumulated {traversalType.toUpperCase()} output:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {visitedNodes.map((val, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                          color: 'var(--fg)',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          fontWeight: 600,
                        }}
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step-by-Step Explanatory Log Buffer */}
          <div
            style={{
              background: 'color-mix(in srgb, var(--bg) 95%, #080908)',
              border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
              borderRadius: '3px',
              padding: '14px 18px',
              maxHeight: '130px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            <div style={{ color: 'var(--dim)', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '2px' }}>
              // EXECUTION STEP TELEMETRY & LOGIC
            </div>
            {logs.slice(-4).map((log, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: 'var(--accent)', fontSize: '10px' }}>&gt;</span>
                <span style={{ color: 'var(--chrome)' }}>{log.message}</span>
                {log.codeLine && <span style={{ color: 'var(--dim)', marginLeft: 'auto', fontSize: '10px' }}>[{log.codeLine}]</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Sub-component for Binary Tree Nodes
const TreeNode: React.FC<{ value: number; active: boolean; visited: boolean }> = ({ value, active, visited }) => {
  let bg = 'color-mix(in srgb, var(--bg) 90%, #151815)';
  let border = '1px solid color-mix(in srgb, var(--fg) 14%, transparent)';
  let color = 'var(--fg)';

  if (active) {
    bg = 'var(--accent)';
    border = '1px solid #ffffff';
    color = 'var(--bg)';
  } else if (visited) {
    bg = 'color-mix(in srgb, #66cc6a 20%, transparent)';
    border = '1px solid #66cc6a';
    color = '#66cc6a';
  }

  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: bg,
        border,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: '12px',
        transition: 'all 200ms ease',
        boxShadow: active ? '0 0 10px var(--accent)' : 'none',
      }}
    >
      {value}
    </div>
  );
};
