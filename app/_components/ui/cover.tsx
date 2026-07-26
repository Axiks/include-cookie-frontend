'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Skeleton } from '@radix-ui/themes'

export default function Cover({ src, height }: { src: string | undefined; height?: string }) {
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)
    const maxH = height ?? '300px'

    // Cached images may finish loading before onLoad is attached — check on mount
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
            setLoaded(true)
        }
    }, [src])

    if (!src) return null

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                minHeight: loaded ? undefined : maxH,
            }}
        >
            {!loaded && (
                <Skeleton
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: 'var(--radius-4)',
                    }}
                />
            )}
            <Image
                ref={imgRef}
                src={src}
                alt="cover"
                width={0}
                height={0}
                sizes="100vw"
                onLoad={() => setLoaded(true)}
                style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: maxH,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-4)',
                    opacity: loaded ? 1 : 0,
                }}
            />
        </div>
    )
}
