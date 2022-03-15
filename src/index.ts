import { FilterErrorResult, FilterPluginInterface, FilterResult } from 'shepherd-plugin-interfaces'
import AWS from 'aws-sdk'
import axios from 'axios'

/**
 * Files to be classified arrive as arraybuffers from shepherd's internal Filter Host. 
 * It's up to you how you want to send them to your filter container, but this stub is where you do it. 
 * You could send them directly via http API call or pass them to an S3 Bucket. Whatever best suits your case.
 */


/* Naive API implementation. (Suitable for fast returning functions only)  */
const checkFileAPI = async(buffer: Buffer, mimetype: string, txid: string): Promise<FilterResult | FilterErrorResult> => {

	// how long will this take with shepherd waiting for this on the call stack? may not perform too well
	const { data } = await axios.put('http://your-container/check', { buffer, mimetype, txid})

	// just return true or false directly to shepherd (for another option see S3 example's return type)
	return {
		flagged: data.flaggedResult,
	}
}

/* Potential S3 based implementation */

const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
const bucketName = process.env.AWS_INPUT_BUCKET

const checkFileS3 = async(buffer: Buffer, mimetype: string, txid: string): Promise<FilterResult | FilterErrorResult> => {
	
	// upload to your S3 bucket where your container could be triggered to find it
	const res = await s3.upload({
		Bucket: bucketName!,
		Key: txid,
		ContentType: mimetype,
		Body: buffer,
	}).promise()

	// return a special 'noop' message, so that shepherd knows the file is being processed, but doesn't wait for the return.
	return {
		data_reason: 'noop',
		flagged: undefined,
	}
}


/* Here is the required shape of the export */

const NsfwjsPlugin: FilterPluginInterface = {
	init: async()=>console.log('any initialisation could go here to be called early'),
	checkImage: checkFileS3, // or checkFileAPI
}

export default NsfwjsPlugin;


