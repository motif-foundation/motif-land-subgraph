import {
    createReserveListing,
    createReserveListingBid,
    findOrCreateCurrency,
    findOrCreateUser,
    handleBidReplaced,
    handleFinishedListing,
    handleReserveListingExtended,
    setReserveListingFirstBidTime,
} from './helpers'
import {
    ListingApprovalUpdated,
    ListingDropApprovalUpdated,
    ListingBid,
    ListingCanceled,
    ListingCreated,
    ListingDurationExtended,
    ListingEnded,
    ListingListPriceUpdated
} from '../types/LandListing/LandListing'
// import {
//   Land as LandContract 
// } from '../types/Land/Land'



import { Land, ReserveListing } from '../types/schema'
import { log } from '@graphprotocol/graph-ts'

export function handleReserveListingCreated(event: ListingCreated): void {

    log.info(`Starting handler for ListingCreated for listing {}`, [event.params.listingId.toString()])

    let tokenId = event.params.tokenId.toString()
    let tokenOwner = findOrCreateUser(event.params.tokenOwner.toHexString())
    let intermediary = findOrCreateUser(event.params.intermediary.toHexString())


	  let tokenContractAddress =event.params.tokenContract.toHexString()
	  let token = tokenContractAddress.concat('-').concat(tokenId)  
	  let land = Land.load(token) 

	  //let landContract = LandContract.bind(event.params.tokenContract)
	  //let landExchangeAddress = landContract.landExchangeContract()

    createReserveListing(
        event.params.listingId.toString(),
        event.transaction.hash.toHexString(),
        event.params.tokenId,
        event.params.tokenContract.toHexString(),
        //landExchangeAddress.toHexString(),
        land,
        event.params.startsAt, 
        event.params.duration,
        event.params.listPrice,
        event.params.listType,
        event.params.intermediaryFeePercentage,
        findOrCreateCurrency(event.params.listCurrency.toHexString()),
        event.block.timestamp,
        event.block.number,
        tokenOwner,
        intermediary
    )

    log.info(`Completed handler for ListingCreated for listing {}`, [event.params.listingId.toString()])
}

export function handleReserveListingApprovalUpdate(event: ListingApprovalUpdated): void {
    let id = event.params.listingId.toString()
    log.info(`Starting handler for ListingApprovalUpdate on listing {}`, [id])

    let listing = ReserveListing.load(id)

    listing.approved = event.params.approved
    listing.status = 'Active'
    listing.approvedTimestamp = event.block.timestamp;
    listing.approvedBlockNumber = event.block.number;
    listing.save()

    log.info(`Completed handler for ListingApprovalUpdate on listing {}`, [id])
}


export function handleReserveListingDropApprovalUpdate(event: ListingDropApprovalUpdated): void {
    let id = event.params.listingId.toString()
    log.info(`Starting handler for ListingDropApprovalUpdate on listing {}`, [id])

    let listing = ReserveListing.load(id)

    listing.approved = event.params.approved
    listing.status = 'Active'
    listing.approvedTimestamp = event.block.timestamp;
    listing.approvedBlockNumber = event.block.number;
    listing.startsAt = event.params.startsAt;

    listing.save()

    log.info(`Completed handler for ListingApprovalUpdate on listing {}`, [id])
}

export function handleReserveListingListPriceUpdate(event: ListingListPriceUpdated): void {
    let id = event.params.listingId.toString()
    log.info(`Starting handler for ListingApprovalUpdate on listing {}`, [id])

    let listing = ReserveListing.load(id)

    listing.listPrice = event.params.listPrice
    listing.save()

    log.info(`Completed handler for ListingApprovalUpdate on listing {}`, [id])
}

export function handleReserveListingBid(event: ListingBid): void {
    let listingId = event.params.listingId.toString()
    log.info(`Starting handler for ListingBid on listing {}`, [listingId])

    let listing = ReserveListing.load(listingId)

    if (listing === null) {
        log.error('Missing Reserve Listing with id {} for bid', [listingId])
        return
    }

    if (event.params.firstBid) {
        log.info('setting listing first bid time', [])
        setReserveListingFirstBidTime(listing as ReserveListing, event.block.timestamp)
    } else {
        log.info('replacing bid', [])
        handleBidReplaced(listing as ReserveListing, event.block.timestamp, event.block.number)
    }

    let id = listingId.concat('-').concat(event.transaction.hash.toHexString()).concat('-').concat(event.logIndex.toString())

    createReserveListingBid(
        id,
        event.transaction.hash.toHexString(),
        listing as ReserveListing,
        event.params.value,
        event.block.timestamp,
        event.block.number,
        findOrCreateUser(event.params.sender.toHexString())
    )

    log.info(`Completed handler for ListingBid on listing {}`, [listingId])
}

export function handleReserveListingDurationExtended(event: ListingDurationExtended): void {
    let listingId = event.params.listingId.toString()
    log.info(`Starting handler for ListingDurationExtended on listing {}`, [listingId])

    let listing = ReserveListing.load(listingId)

    if (listing === null) {
        log.error('Missing Reserve Listing with id {} for bid', [listingId])
        return
    }

    handleReserveListingExtended(listing as ReserveListing, event.params.duration);

    log.info(`Completed handler for ListingDurationExtended on listing {}`, [listingId])
}

export function handleReserveListingEnded(event: ListingEnded): void {
    let listingId = event.params.listingId.toString()
    log.info(`Starting handler for ListingEnd on listing {}`, [listingId])

    let listing = ReserveListing.load(listingId)

    if (!listing) {
        log.error('Missing Reserve Listing with id {} for bid', [listingId])
        return
    }

    // First, remove the current bid and set it to the winning bid
    handleBidReplaced(listing as ReserveListing, event.block.timestamp, event.block.number, true)

    // Then, finalize the listing
    handleFinishedListing(listing as ReserveListing, event.block.timestamp, event.block.number)

    log.info(`Completed handler for ListingEnd on listing {}`, [listingId])
}

export function handleReserveListingCanceled(event: ListingCanceled): void {
    let listingId = event.params.listingId.toString()
    log.info(`Starting handler for ListingCanceled on listing {}`, [listingId])

    let listing = ReserveListing.load(listingId)

    if (!listing) {
        log.error('Missing Reserve Listing with id {} for bid', [listingId])
    }

    // First, remove any current bid and set it to refunded
    if (listing.currentBid) {
        handleBidReplaced(listing as ReserveListing, event.block.timestamp, event.block.number)
    }

    // Then, create an inactive listing based of of the current active listing
    // Then, finalize the listing
    handleFinishedListing(listing as ReserveListing, event.block.timestamp, event.block.number)

    log.info(`Completed handler for ListingCanceled on listing {}`, [listingId])
}